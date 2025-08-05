import type { AuthorizationServerState } from "./src/resources";

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
	secret: "12345678901234567890123456789012",
	access_token_encryption: "A128CBC-HS256", // see https://github.com/panva/jose/issues/210#jwe-enc
	access_token_ttl: 3600 * 2,
	issuer_client: {
		scopes: [
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
