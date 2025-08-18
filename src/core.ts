import { merge } from "ts-deepmerge";
import type { Config } from "./config";
import {
	type AuthorizeHandlerConfig,
	authorizeHandlerFactory,
	type CredentialOfferHandlerConfig,
	credentialOfferHandlerFactory,
	type NonceHandlerConfig,
	nonceHandlerFactory,
	type OauthAuthorizationServerHandlerConfig,
	type OpenidCredentialIssuerHandlerConfig,
	oauthAuthorizationServerHandlerFactory,
	openidCredentialIssuerHandlerFactory,
	type PushedAuthorizationRequestHandlerConfig,
	pushedAuthorizationRequestHandlerFactory,
	type TokenHandlerConfig,
	tokenHandlerFactory,
	validateAuthorizeHandlerConfig,
	validateCredentialOfferHandlerConfig,
	validateNonceHandlerConfig,
	validateOauthAuthorizationServerHandlerConfig,
	validatePushedAuthorizationRequestHandlerConfig,
	validateTokenHandlerConfig,
} from "./handlers";

export class Core {
	config: Config;

	constructor(config: Config) {
		defaultConfig.issuer_client.id = config.issuer_url;

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

	get nonce() {
		validateNonceHandlerConfig(this.config);

		return nonceHandlerFactory(this.config as NonceHandlerConfig);
	}

	get pushedAuthorizationRequest() {
		validatePushedAuthorizationRequestHandlerConfig(this.config);

		return pushedAuthorizationRequestHandlerFactory(
			this.config as PushedAuthorizationRequestHandlerConfig,
		);
	}

	get authorize() {
		validateAuthorizeHandlerConfig(this.config);

		return authorizeHandlerFactory(this.config as AuthorizeHandlerConfig);
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
	pushed_authorization_request_ttl: 300,
	authorization_code_ttl: 60,
	issuer_state_ttl: 300,
	token_encryption: "A128CBC-HS256", // see https://github.com/panva/jose/issues/210#jwe-enc
	databaseOperations: {},
	issuer_client: {
		id: "",
		scopes: [],
	},
	issuer_display: [],
	supported_credential_configurations: [],
};
