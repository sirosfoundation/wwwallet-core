import fs from "node:fs";
import path from "node:path";
import express from "express";
import {
	type AuthorizationServerState,
	Protocols,
	type ResourceOwner,
	validateAuthorizeHandlerConfig,
	validateCredentialHandlerConfig,
	validateCredentialOfferHandlerConfig,
	validateNonceHandlerConfig,
	validateOauthAuthorizationServerHandlerConfig,
	validateOpenidCredentialIssuerHandlerConfig,
	validatePushedAuthorizationRequestHandlerConfig,
	validateTokenHandlerConfig,
} from "../../src";

export function server(protocols: Protocols): express.Express {
	const app = express();

	app.use(express.json());
	app.use(express.urlencoded());

	app.get("/", (_req, res) => {
		res.redirect("/offer/select-a-credential");
	});

	app.get("/healthz", (_req, res) => {
		try {
			// trigger handlers configuration validation
			validateAuthorizeHandlerConfig(protocols.config);
			validateCredentialHandlerConfig(protocols.config);
			validateCredentialOfferHandlerConfig(protocols.config);
			validateNonceHandlerConfig(protocols.config);
			validateOauthAuthorizationServerHandlerConfig(protocols.config);
			validateOpenidCredentialIssuerHandlerConfig(protocols.config);
			validatePushedAuthorizationRequestHandlerConfig(protocols.config);
			validateTokenHandlerConfig(protocols.config);

			res.status(200).send("ok");
		} catch (error) {
			res.status(500).send((error as Error).message);
		}
	});

	app.get("/.well-known/oauth-authorization-server", async (req, res) => {
		const response = await protocols.oauthAuthorizationServer(req);

		return res.status(response.status).send(response.body);
	});

	app.get("/.well-known/openid-credential-issuer", async (req, res) => {
		const response = await protocols.openidCredentialIssuer(req);

		return res.status(response.status).send(response.body);
	});

	app.post("/nonce", async (req, res) => {
		const response = await protocols.nonce(req);

		return res.status(response.status).send(response.body);
	});

	app.post("/pushed-authorization-request", async (req, res) => {
		const response = await protocols.pushedAuthorizationRequest(req);

		return res.status(response.status).send(response.body);
	});

	app.get("/authorize", async (req, res) => {
		const response = await protocols.authorize(req);

		if (response.status === 302) {
			return res.redirect(response.location);
		}

		const credentialConfigurations =
			protocols.config.supported_credential_configurations?.filter(
				(configuration) => {
					if (response.status === 200) {
						return response.data.authorizationRequest.scope
							?.split(" ")
							.includes(configuration.scope);
					}
				},
			) || [];

		return res.status(response.status).send({
			data: {
				credentialConfigurations,
				...response.data,
			},
		});
	});

	app.post("/authorize", async (req, res) => {
		let resourceOwner: ResourceOwner | null;
		const authenticationError: {
			error?: Error;
			errorMessage?: string;
		} = {};

		const { username, password } = req.body || {};

		if (username === "wwwallet" && password === "tellawww") {
			resourceOwner = { sub: "sub", username };
		} else {
			resourceOwner = null;
			authenticationError.error = new Error("invalid credentials");
			authenticationError.errorMessage = "invalid username or password";
		}

		const response = await protocols.authorize(req, resourceOwner);

		if (response.status === 302) {
			return res.redirect(response.location);
		}

		const credentialConfigurations =
			protocols.config.supported_credential_configurations?.filter(
				(configuration) => {
					if (response.status === 200) {
						return response.data.authorizationRequest.scope
							?.split(" ")
							.includes(configuration.scope);
					}
				},
			) || [];

		return res.status(response.status).send({
			data: {
				credentialConfigurations,
				...authenticationError,
				...response.data,
			},
		});
	});

	app.post("/token", async (req, res) => {
		const response = await protocols.token(req);

		return res.status(response.status).send(response.body);
	});

	app.post("/credential", async (req, res) => {
		const response = await protocols.credential(req);

		return res.status(response.status).send(response.body);
	});

	app.get("/offer/:scope", async (req, res) => {
		const response = await protocols.credentialOffer(req);

		if (req.get("accept")?.match("application/json")) {
			return res.status(response.status).send(response.body);
		}

		if (req.get("accept")?.match("text/html")) {
			return res.status(response.status).send({
				data: {
					supportedCredentialConfigurations:
						protocols.config.supported_credential_configurations,
					...response.data,
				},
			});
		}

		return res.status(400).send({
			error: "invalid_request",
			error_description: "accept header is missing from request",
		});
	});

	return app;
}

export const config = {
	logger: {
		business: (
			_event: string,
			_data: { [key: string]: string | undefined },
		) => {},
		error: (_message: string) => {},
		info: (_message: string) => {},
		warn: (_message: string) => {},
		debug: (_message: string) => {},
	},
	issuer_url: "http://localhost:5000",
	wallet_url: "http://localhost:3000",
	databaseOperations: {
		async insertAuthorizationServerState(
			authorizationServerState: AuthorizationServerState,
		) {
			// @ts-ignore
			this.__authorizationServerState = authorizationServerState;
			return authorizationServerState;
		},
		__authorizationServerState: null,
		async resourceOwnerData(sub: string, vct?: string) {
			return { sub, vct };
		},
	},
	clients: [
		{
			id: "id",
			secret: "secret",
			scopes: ["full:scope", "client:scope"],
			redirect_uris: ["http://redirect.uri"],
		},
		{
			id: "other",
			secret: "other",
			scopes: ["other:scope"],
			redirect_uris: ["http://other.uri"],
		},
	],
	issuer_display: [{ name: "Test issuer" }],
	token_encryption: "A256CBC-HS512", // see https://github.com/panva/jose/issues/210#jwe-enc
	secret_base: "test",
	rotate_secret: true,
	issuer_client: {
		scopes: ["not_found:scope", "full:scope", "full:scope:mso_mdoc"],
	},
	supported_credential_configurations: [
		"./credential_configurations/full.sd-jwt.json",
		"./credential_configurations/full.mso_mdoc.json",
	].map((credentialConfigurationPath) => {
		const credential = fs
			.readFileSync(path.join(__dirname, credentialConfigurationPath))
			.toString();

		return JSON.parse(credential);
	}),
	trusted_root_certificates: [
		`-----BEGIN CERTIFICATE-----
MIICQDCCAeegAwIBAgIUa5v+g+yHrVdDFEfRy8GyoGtcT4YwCgYIKoZIzj0EAwIw
PzELMAkGA1UEBhMCRVUxFTATBgNVBAoMDHd3V2FsbGV0Lm9yZzEZMBcGA1UEAwwQ
d3dXYWxsZXQgUm9vdCBDQTAeFw0yNTA0MjIxMDM5NDZaFw00MDA0MTgxMDM5NDZa
MD8xCzAJBgNVBAYTAkVVMRUwEwYDVQQKDAx3d1dhbGxldC5vcmcxGTAXBgNVBAMM
EHd3V2FsbGV0IFJvb3QgQ0EwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASkZIoc
6df1R0mEWz3qHQxgRjKDtVTZvDzhPCEqVTePw4zSzy8T0VCdOH77ItRP1w3Rwjeg
vHrY1CzmMNtQDWoMo4HAMIG9MB0GA1UdDgQWBBTQca7dP79aqHfI2J/P2w134c8F
LjAOBgNVHQ8BAf8EBAMCAQYwMgYDVR0SBCswKYERaW5mb0B3d3dhbGxldC5vcmeG
FGh0dHBzOi8vd3d3YWxsZXQub3JnMBIGA1UdEwEB/wQIMAYBAf8CAQAwRAYDVR0f
BD0wOzA5oDegNYYzaHR0cHM6Ly93d3dhbGxldC5vcmcvaWFjYS9jcmwvd3d3YWxs
ZXRfb3JnX2lhY2EuY3JsMAoGCCqGSM49BAMCA0cAMEQCIF+qqe7urRAop2jQJ6B9
fYvvp4c4HYxsWLNa9aYpCWxxAiAGgtVdZWW19dDU1G0AGy8FTWlcKiczWyVIQtvA
L3rT4w==
-----END CERTIFICATE-----`,
	],
};

export const protocols = new Protocols(config);

export const app = server(protocols);
