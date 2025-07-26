import express from "express";
import expressListRoutes from "express-list-routes";
import { core } from "./app.container";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
	res.send("Hello World!");
});

let reqPerSecond = 0;
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

app.listen(5000, () => {
	console.log(
		"========== wwwallet client credentials Proof of Concept listening to port 5000",
	);

	expressListRoutes(app);
	console.log("==========");
});

export { app };
