import { merge } from "ts-deepmerge";
import type { Config } from "./config";
import { secretDerivation } from "./crypto";
import {
	type AuthorizeHandlerConfig,
	authorizeHandlerFactory,
	type CredentialHandlerConfig,
	type CredentialOfferHandlerConfig,
	credentialHandlerFactory,
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
	validateCredentialHandlerConfig,
	validateCredentialOfferHandlerConfig,
	validateNonceHandlerConfig,
	validateOauthAuthorizationServerHandlerConfig,
	validatePushedAuthorizationRequestHandlerConfig,
	validateTokenHandlerConfig,
} from "./handlers";

const SECRET_MEMORY = 10;

export class Core {
	config: Config;

	constructor(config: Config) {
		defaultConfig.issuer_client.id = config.issuer_url;

		this.config = merge(defaultConfig, config);
		this.rotateSecret();
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

	get credential() {
		validateCredentialHandlerConfig(this.config);

		return credentialHandlerFactory(this.config as CredentialHandlerConfig);
	}

	get credentialOffer() {
		validateCredentialOfferHandlerConfig(this.config);

		return credentialOfferHandlerFactory(
			this.config as CredentialOfferHandlerConfig,
		);
	}

	rotateSecret() {
		if (
			this.config.secret_ttl &&
			this.config.rotate_secret &&
			this.config.secret_base
		) {
			const base = this.config.secret_base;
			const ttl = this.config.secret_ttl;
			const now = Date.now() / 1000;
			const newSecret = secretDerivation(base, Math.floor(now / ttl));
			this.config.previous_secrets?.unshift(this.config.secret || newSecret);
			this.config.previous_secrets = this.config.previous_secrets?.slice(
				0,
				SECRET_MEMORY,
			);
			this.config.secret = newSecret;

			setTimeout(() => {
				this.rotateSecret();
			}, this.config.secret_ttl * 1000);
		}
	}
}

export const defaultConfig = {
	logger: {
		business: (event: string, data: { [key: string]: string | undefined }) =>
			console.info(`${event} - `, JSON.stringify(data)),
		error: console.error,
		info: console.info,
		warn: console.warn,
		debug: console.debug,
	},
	clients: [],
	access_token_ttl: 60,
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
	trusted_root_certificates: [],
	previous_secrets: [],
	secret_ttl: 720,
	rotate_secret: false,
};
