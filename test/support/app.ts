import fs from "node:fs";
import path from "node:path";
import { server } from "../../app";
import { Core } from "../../src";

export const config = {
	issuer_url: "http://localhost:5000",
	wallet_url: "http://localhost:3000",
	databaseOperations: {
		async insertAuthorizationServerState(
			authorizationServerState: AuthorizationServerState,
		) {
			console.log("insertAuthorizationServerState not implemented");
			return authorizationServerState;
		},
	},
	tokenGenerators: {
		issuerState: () => "issuerStateGeneratedToken",
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
			"not_found:scope",
			"minimal:scope",
			"ehic",
			"diploma",
			"pid:jpt_dc",
			"pid:mso_mdoc",
			"pid:sd_jwt_dc",
			"pid:sd_jwt_dc:arf_1_5",
			"pid:sd_jwt_vc:arf_1_5",
			"pid:sd_jwt_vc",
			"por:sd_jwt_vc",
		],
	},
	supported_credential_configurations: [
		"./credential_configurations/minimal.json",
	].map((credentialConfigurationPath) => {
		const credential = fs
			.readFileSync(path.join(__dirname, credentialConfigurationPath))
			.toString();

		return JSON.parse(credential);
	}),
};

const app = server(new Core(config));

export { app };
