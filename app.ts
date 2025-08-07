import express from "express";
import { engine } from "express-handlebars";
import type { Core } from "./src";

export function server(core: Core) {
	const app = express();

	app.use(express.json());
	app.use(express.urlencoded());

	app.engine("handlebars", engine());
	app.set("view engine", "handlebars");
	app.set("views", "./views");

	app.use(express.static("public"));

	app.get("/", (_req, res) => {
		res.send("Hello World!");
	});

	let reqPerSecond = 1;
	let now = Date.now();
	app.post("/token", async (req, res) => {
		if (Date.now() - now > 1000) {
			console.log("request per second", reqPerSecond);

			reqPerSecond = 0;
			now = Date.now();
		}
		reqPerSecond++;

		const response = await core.clientCredentials(req);

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
					...response.body,
				},
			});
		}

		return res.status(415).send({
			error: "invalid_request",
			error_description: "unsupported media type",
		});
	});

	return app;
}
