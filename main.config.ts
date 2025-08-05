import fs from "node:fs";
import path from "node:path";
import type { AuthorizationServerState } from "./src/resources";

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
		// "./credentials/eu.europa.ec.eudi.pid.1.json",
		// "./credentials/urn:credential:diploma.json",
		// "./credentials/urn:eu.europa.ec.eudi:pid:1:dc.json",
		// "./credentials/urn:eu.europa.ec.eudi:pid:1:vc.json",
		// "./credentials/urn:eu.europa.ec.eudi:por:1.json",
		// "./credentials/urn:eudi:ehic:1.json",
		// "./credentials/urn:eudi:pid:1:dc.json",
		// "./credentials/urn:eudi:pid:1:dc:jpt.json",
		// "./credentials/urn:eudi:pid:1:vc.json",
	].map((credentialConfigurationPath) => {
		const credential = fs
			.readFileSync(path.join(__dirname, credentialConfigurationPath))
			.toString();

		return JSON.parse(credential);
	}),
};
