import fs from "node:fs";
import path from "node:path";
import { server } from "../../app";
import { Core } from "../../src";

export const config = {
	logger: {
		error: (_message: string) => {},
		info: (_message: string) => {},
		warn: (_message: string) => {},
		debug: (_message: string) => {},
	},
	issuer_url: "http://localhost:5000",
	wallet_url: "http://localhost:3000",
	databaseOperations: {
		async insertAuthorizationServerState(
			authorizationServerState: AuthorizationServerState,
		) {
			this.__authorizationServerState = authorizationServerState;
			return authorizationServerState;
		},
		__authorizationServerState: null,
	},
	tokenGenerators: {
		generateIssuerState: () => "issuerStateGeneratedToken",
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
		scopes: ["not_found:scope", "minimal:scope"],
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

export const core = new Core(config);

export const app = server(core);
