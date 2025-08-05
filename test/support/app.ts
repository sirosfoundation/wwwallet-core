import { server } from "../../app";
import { Core } from "../../src";

export const config = {
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
		id: "id",
		secret: "secret",
		scopes: [
			"urn:eudi:ehic:1",
			"urn:credential:diploma",
			"urn:eudi:pid:1:dc:jpt",
			"eu.europa.ec.eudi.pid.1",
			"urn:eudi:pid:1:dc",
			"urn:eu.europa.ec.eudi:pid:1:dc",
			"urn:eu.europa.ec.eudi:pid:1:vc",
			"urn:eudi:pid:1:vc",
			"urn:eu.europa.ec.eudi:por:1",
		],
	},
};

const app = server(new Core(config));

export { app };
