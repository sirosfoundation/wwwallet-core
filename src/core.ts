import { merge } from "ts-deepmerge";
import { v6 as uuidv6 } from "uuid";
import type { Config } from "./config";
import {
	type CredentialOfferHandlerConfig,
	credentialOfferHandlerFactory,
	type OauthAuthorizationServerHandlerConfig,
	type OpenidCredentialIssuerHandlerConfig,
	oauthAuthorizationServerHandlerFactory,
	openidCredentialIssuerHandlerFactory,
	type TokenHandlerConfig,
	tokenHandlerFactory,
	validateCredentialOfferHandlerConfig,
	validateOauthAuthorizationServerHandlerConfig,
	validateTokenHandlerConfig,
} from "./handlers";

export class Core {
	config: Config;

	constructor(config: Config) {
		this.config = merge(defaultConfig, config);
	}

	get oauthAuthorizationServer() {
		validateOauthAuthorizationServerHandlerConfig(this.config);

		return oauthAuthorizationServerHandlerFactory(
			this.config as OauthAuthorizationServerHandlerConfig,
		);
	}

	get openidCredentialIssuer() {
		validateOauthAuthorizationServerHandlerConfig(this.config);

		return openidCredentialIssuerHandlerFactory(
			this.config as OpenidCredentialIssuerHandlerConfig,
		);
	}

	get token() {
		validateTokenHandlerConfig(this.config);

		return tokenHandlerFactory(this.config as TokenHandlerConfig);
	}

	get credentialOffer() {
		validateCredentialOfferHandlerConfig(this.config);

		return credentialOfferHandlerFactory(
			this.config as CredentialOfferHandlerConfig,
		);
	}
}

export const defaultConfig = {
	logger: console,
	clients: [],
	access_token_ttl: 3600 * 2,
	access_token_encryption: "A128CBC-HS256", // see https://github.com/panva/jose/issues/210#jwe-enc
	databaseOperations: {},
	tokenGenerators: {
		generateIssuerState: uuidv6,
	},
	issuer_client: {
		scopes: [],
	},
	issuer_display: [],
	supported_credential_configurations: [],
};
