import express from "express";
import type { Core } from "./src";

export function server(core: Core) {
	const app = express();

	app.use(express.json());
	app.use(express.urlencoded());

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

		if (req.get("accept") === "application/json") {
			return res.status(response.status).send(response.body);
		}

		if (req.get("accept") === "text/html") {
			return res.status(response.status).send(response.body);
		}

		return res.status(415).send({
			error: "invalid_request",
			error_description: "unsupported media type",
		});
	});

	return app;
}
