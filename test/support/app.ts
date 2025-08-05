import { server } from "../../app";
import { Core } from "../../src";

export const config = {
	issuer_url: "http://localhost:5000",
	wallet_url: "http://localhost:3000",
	databaseOperations: {
		async insertAuthorizationServerState(
			authorizationServerState: AuthorizationServerState,
		) {
			console.log("insertFlowState not implemented");
			return authorizationServerState;
		},
	},
	clients: [
		{
			id: "id",
			secret: "secret",
			scopes: ["client:scope"],
		},
	],
	secret: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	access_token_encryption: "A128CBC-HS256", // see https://github.com/panva/jose/issues/210#jwe-enc
	access_token_ttl: 3600 * 2,
	issuer_client: {
		scopes: [
			"test:scope",
			"eu.europa.ec.eudi.pid.1",
			"urn:credential:diploma",
			"urn:eu.europa.ec.eudi:pid:1:dc",
			"urn:eu.europa.ec.eudi:pid:1:vc",
			"urn:eu.europa.ec.eudi:por:1",
			"urn:eudi:ehic:1",
			"urn:eudi:pid:1:dc",
			"urn:eudi:pid:1:dc:jpt",
			"urn:eudi:pid:1:vc",
		],
	},
};

const app = server(new Core(config));

export { app };
