import path from "node:path";
import {
	type Protocols,
	type ResourceOwner,
	type Storage,
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

export function server({
	protocols,
	storage,
}: {
	protocols: Protocols;
	storage: Storage;
}): Express {
	const app = express();

	app.use(morgan("combined"));

	app.use(express.json());
	app.use(express.urlencoded());

	app.use(express.json({ type: ["application/jwk+json"] }));
	app.use(express.text({ type: ["application/jose"] }));

	Handlebars.registerHelper("equals", (a: unknown, b: unknown) => a === b);
	app.engine("handlebars", engine());
	app.set("view engine", "handlebars");
	app.set("views", path.join(__dirname, "views"));

	app.use(express.static(path.join(__dirname, "public")));

	// --- Protocols

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

	app.get("/offer/:scope", async (req, res) => {
		const response = await protocols.credentialOffer(req);

		if (req.get("accept")?.match("application/json")) {
			return res.status(response.status).send(response.body);
		}

		if (req.get("accept")?.match("text/html")) {
			return res.status(response.status).render("issuance/credential_offer", {
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

	// --- Storage

	app.get("/event-store/events", async (req, res) => {
		const response = await storage.getEvents(req);

		return res.status(response.status).send(response.body);
	});

	app.put("/event-store/events/:hash", async (req, res) => {
		const response = await storage.storeEvent(req);

		return res.status(response.status).send(response.body);
	});

	app.post("/authorization-challenge", async (req, res) => {
		const response = await storage.authorizationChallenge(req);

		return res.status(response.status).send(response.body);
	});
	return app;
}
