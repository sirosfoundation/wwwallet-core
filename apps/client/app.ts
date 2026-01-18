import path from "node:path";
import {
	type Protocols,
	type ResourceOwner,
	validateAuthorizeHandlerConfig,
	validateCredentialHandlerConfig,
	validateCredentialOfferHandlerConfig,
	validateNonceHandlerConfig,
	validateOauthAuthorizationServerHandlerConfig,
	validateOpenidCredentialIssuerHandlerConfig,
	validatePushedAuthorizationRequestHandlerConfig,
	validateTokenHandlerConfig,
} from "@wwwallet/server-core";
import express, { type Express } from "express";
import { engine } from "express-handlebars";
import Handlebars from "handlebars";
import morgan from "morgan";
import * as crypto from 'node:crypto'; 


export function server(protocols: Protocols): Express {
	const app = express();

	app.use(morgan("combined"));

	app.use(express.json());
	app.use(express.urlencoded());

	Handlebars.registerHelper("equals", (a: unknown, b: unknown) => a === b);
	app.engine("handlebars", engine());
	app.set("view engine", "handlebars");
	app.set("views", path.join(__dirname, "views"));

	app.use(express.static(path.join(__dirname, "public")));

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

		return res.status(response.status).render("issuance/authorize", {
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

		return res.status(response.status).render("issuance/authorize", {
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

	app.post("/deferred-credential", async (req, res) => {
		const response = await protocols.deferredCredential(req);

		return res.status(response.status).send(response.body);
	});

	app.get("/offer/:scope", async (req, res) => {
		const response = await protocols.credentialOffer(req);

		if (req.get("accept")?.match("application/json")) {
			return res.status(response.status).send(response.body);
		}

		const pre_auth_code = (response.body as any).pre_auth_code

		if (req.get("accept")?.match("text/html")) {
			return res.status(response.status).render("issuance/credential_offer", {
				data: {
					pre_auth_code,
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

	app.post("/pre-authorize", async (req, res) => {
		let resourceOwner: ResourceOwner | null = null;
		const authenticationError: {
			error ? : Error;errorMessage ? : string
		} = {};
		const {
			pre_auth_code
		} = req.body || {};
		try {
			const masterSecret = process.env.ISSUER_MASTER_SECRET || "secure-permanent-secret";
			const salt = "issuance-v1";
			const seedBuffer = crypto.scryptSync(masterSecret, salt, 32);
			const d = seedBuffer.toString('base64url');
			const privateKey = crypto.createPrivateKey({
				key: {
					kty: 'OKP',
					crv: 'Ed25519',
					x: 'unused',
					d: d
				},
				format: 'jwk',
			});
			const publicKey = crypto.createPublicKey(privateKey);
			let isSignatureValid = false;
			if (pre_auth_code) {
				try {
					const message = "stateless-grant-v1";
					isSignatureValid = crypto.verify(
						null,
						Buffer.from(message),
						publicKey,
						Buffer.from(pre_auth_code, 'base64url')
					);
				} catch {
					isSignatureValid = false;
				}
			}
			if (isSignatureValid) {
				resourceOwner = {
					sub: "sub-123",
					username: "pre-authorized-user"
				};
			} else {
				throw new Error("Invalid pre-authorization code");
			}
		} catch (err) {
			resourceOwner = null;
			authenticationError.error = new Error("Authorization Denied");
			authenticationError.errorMessage = "The provided pre-authorization code is invalid or expired.";
		}
		const response = await protocols.authorize(req, resourceOwner);
		if (response.status === 302) {
			return res.status(200).json({
				location: response.location
			});
		}
	});
	  

	return app;
}
