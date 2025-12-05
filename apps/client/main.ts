import expressListRoutes from "express-list-routes";
import { server } from "./app";
import { protocols } from "./container";

const app = server(protocols);
const port = process.env.PORT || 5000;

// starts the server
app.listen(port, (error) => {
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
