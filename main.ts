import expressListRoutes from "express-list-routes";
import { server } from "./app";
import { core } from "./main.container";

const app = server(core);
const port = process.env.PORT || 5000;

// starts the server
app.listen(port, () => {
	console.log(
		`========== wwwallet issuer Proof of Concept listening to port ${port}`,
	);

	expressListRoutes(app);
	console.log("==========");
});
