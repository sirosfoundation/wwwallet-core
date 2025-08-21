import fs from "node:fs";
import path from "node:path";
import { type AuthorizationServerState, Core } from "@wwwallet/core";
import { server } from "../../app";

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
		async resourceOwnerData(sub: string, vct: string) {
			return { sub, vct };
		},
	},
	clients: [
		{
			id: "id",
			secret: "secret",
			scopes: ["client:scope"],
			redirect_uris: ["http://redirect.uri"],
		},
	],
	issuer_display: [{ name: "Test issuer" }],
	secret: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	token_encryption: "A128CBC-HS256", // see https://github.com/panva/jose/issues/210#jwe-enc
	access_token_ttl: 3600 * 2,
	issuer_client: {
		scopes: ["not_found:scope", "full:scope", "full:scope:mso_mdoc"],
	},
	supported_credential_configurations: [
		"./credential_configurations/full.sd-jwt.json",
		"./credential_configurations/full.mso_mdoc.json",
	].map((credentialConfigurationPath) => {
		const credential = fs
			.readFileSync(path.join(__dirname, credentialConfigurationPath))
			.toString();

		return JSON.parse(credential);
	}),
};

export const core = new Core(config);

export const app = server(core);
