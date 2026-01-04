import expressListRoutes from "express-list-routes";
import { server } from "./app";
import { config } from "./config";
import { protocols, redisClient, storage } from "./container";

const app = server({ protocols, storage });
const port = process.env.PORT || 5000;

async function start() {
	if (config.redis_url) {
		await redisClient.connect().then(() => {
			console.log("connected to Redis");
		});
	}

	// starts the server
	return app.listen(port, (error) => {
		if (error) {
			console.error(error);
			return;
		}

		console.log(
			`========== wwwallet issuer Proof of Concept listening to port ${port}`,
		);

		expressListRoutes(app);
		console.log("==========");
	});
}

start();
