import fs from "node:fs";
import path from "node:path";
import { v6 as uuidv6 } from "uuid";
import { Logger } from "./main.logger";
import type { Config } from "./src";
import type { AuthorizationServerState } from "./src/resources";

const logger = new Logger("info");

export const config: Config = {
	logger: logger,
	issuer_url: "https://demo-issuer.wwwallet.org",
	wallet_url: "https://demo.wwwallet.org/",
	databaseOperations: {
		async insertAuthorizationServerState(
			authorizationServerState: AuthorizationServerState,
		) {
			logger.debug("insertAuthorizationServerState not implemented");
			return authorizationServerState;
		},
	},
	tokenGenerators: {
		generateIssuerState: uuidv6,
	},
	issuer_display: [
		{
			name: "wwWallet Issuer",
			logo: {
				uri: "https://demo-issuer.wwwallet.org/images/logo.png",
			},
			locale: "en-US",
		},
	],
	clients: [
		{
			id: "CLIENT123",
			secret: "321TNEILC",
			scopes: [
				"client:scope",
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
			redirect_uris: ["http://redirect.uri"],
		},
	],
	secret: "12345678901234567890123456789012", // 32 characters long secret
	token_encryption: "A128CBC-HS256", // see https://github.com/panva/jose/issues/210#jwe-enc
	access_token_ttl: 3600 * 2,
	issuer_client: {
		scopes: [
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
		"./credential_configurations/pid:jpt_dc.json",
		"./credential_configurations/pid:sd_jwt_dc.json",
		"./credential_configurations/pid:sd_jwt_vc.json",
		"./credential_configurations/pid:sd_jwt_dc:arf_1_5.json",
		"./credential_configurations/pid:sd_jwt_vc:arf_1_5.json",
		"./credential_configurations/pid:mso_mdoc.json",
		"./credential_configurations/diploma.json",
		"./credential_configurations/ehic.json",
		"./credential_configurations/por:sd_jwt_vc.json",
	].map((credentialConfigurationPath) => {
		const credential = fs
			.readFileSync(path.join(__dirname, credentialConfigurationPath))
			.toString();

		return JSON.parse(credential);
	}),
};
