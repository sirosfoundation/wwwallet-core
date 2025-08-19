import express from "express";
import { engine } from "express-handlebars";
import Handlebars from "handlebars";
import morgan from "morgan";
import {
	type Core,
	type ResourceOwner,
	validateAuthorizeHandlerConfig,
	validateCredentialOfferHandlerConfig,
	validateNonceHandlerConfig,
	validateOauthAuthorizationServerHandlerConfig,
	validateOpenidCredentialIssuerHandlerConfig,
	validatePushedAuthorizationRequestHandlerConfig,
	validateTokenHandlerConfig,
} from "./src";

export function server(core: Core) {
	const app = express();

	app.use(morgan("combined"));

	app.use(express.json());
	app.use(express.urlencoded());

	Handlebars.registerHelper("equals", (a: unknown, b: unknown) => a === b);
	app.engine("handlebars", engine());
	app.set("view engine", "handlebars");
	app.set("views", "./views");

	app.use(express.static("public"));

	app.get("/", (_req, res) => {
		res.redirect("/offer/select-a-credential");
	});

	app.get("/healthz", (_req, res) => {
		try {
			// trigger handlers configuration validation
			validateAuthorizeHandlerConfig(core.config);
			validateCredentialOfferHandlerConfig(core.config);
			validateNonceHandlerConfig(core.config);
			validateOauthAuthorizationServerHandlerConfig(core.config);
			validateOpenidCredentialIssuerHandlerConfig(core.config);
			validatePushedAuthorizationRequestHandlerConfig(core.config);
			validateTokenHandlerConfig(core.config);

			res.status(200).send("ok");
		} catch (error) {
			res.status(500).send((error as Error).message);
		}
	});

	app.get("/.well-known/oauth-authorization-server", async (req, res) => {
		const response = await core.oauthAuthorizationServer(req);

		return res.status(response.status).send(response.body);
	});

	app.get("/.well-known/openid-credential-issuer", async (req, res) => {
		const response = await core.openidCredentialIssuer(req);

		return res.status(response.status).send(response.body);
	});

	app.post("/nonce", async (req, res) => {
		const response = await core.nonce(req);

		return res.status(response.status).send(response.body);
	});

	app.post("/pushed-authorization-request", async (req, res) => {
		const response = await core.pushedAuthorizationRequest(req);

		return res.status(response.status).send(response.body);
	});

	app.get("/authorize", async (req, res) => {
		const response = await core.authorize(req);

		if (response.status === 302) {
			return res.redirect(response.location);
		}

		const credentialConfigurations =
			core.config.supported_credential_configurations?.filter(
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

		const response = await core.authorize(req, resourceOwner);

		if (response.status === 302) {
			return res.redirect(response.location);
		}

		const credentialConfigurations =
			core.config.supported_credential_configurations?.filter(
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
		const response = await core.token(req);

		return res.status(response.status).send(response.body);
	});

	app.post("/credential", async (req, res) => {
		const response = await core.credential(req);

		return res.status(response.status).send(response.body);
	});

	app.get("/offer/:scope", async (req, res) => {
		const response = await core.credentialOffer(req);

		if (req.get("accept")?.match("application/json")) {
			return res.status(response.status).send(response.body);
		}

		if (req.get("accept")?.match("text/html")) {
			return res.status(response.status).render("issuance/credential_offer", {
				data: {
					supportedCredentialConfigurations:
						core.config.supported_credential_configurations,
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
