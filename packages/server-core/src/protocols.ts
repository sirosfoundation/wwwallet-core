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

/** wwWallet server Protocols class.
 *
 * Core is the entrypoint of OAuth 2.0 family protocolss server implementation.
 * It exposes the request handlers to be used to manage protocolss at server level.
 */
export class Protocols {
	config: Config;

	constructor(config: Config) {
		defaultConfig.issuer_client.id = config.issuer_url || "";

		this.config = merge(defaultConfig, config);
		this.rotateSecret();
	}

	/**
	 * Handle well-known oauth-authorization-server requests
	 */
	get oauthAuthorizationServer() {
		validateOauthAuthorizationServerHandlerConfig(this.config);

		return oauthAuthorizationServerHandlerFactory(
			this.config as OauthAuthorizationServerHandlerConfig,
		);
	}

	/**
	 * Handle well-known openid-credential-issuer requests
	 */
	get openidCredentialIssuer() {
		validateOauthAuthorizationServerHandlerConfig(this.config);

		return openidCredentialIssuerHandlerFactory(
			this.config as OpenidCredentialIssuerHandlerConfig,
		);
	}

	/**
	 * Handle nonce requests
	 *
	 * #### Statements
	 *
	 * - {@link "server-core/src/statements".generateCNonce | generateCNonce}
	 */
	get nonce() {
		validateNonceHandlerConfig(this.config);

		return nonceHandlerFactory(this.config as NonceHandlerConfig);
	}

	/**
	 * Handle pushed authorization requests
	 *
	 * #### Statements
	 *
	 * - {@link "server-core/src/statements".validateClientCredentials | validateClientCredentials}
	 * - {@link "server-core/src/statements".validateScope | validateScope}
	 * - {@link "server-core/src/statements".validateIssuerState | validateIssuerState}
	 * - {@link "server-core/src/statements".generateAuthorizationRequestUri | generateAuthorizationRequestUri}
	 */
	get pushedAuthorizationRequest() {
		validatePushedAuthorizationRequestHandlerConfig(this.config);

		return pushedAuthorizationRequestHandlerFactory(
			this.config as PushedAuthorizationRequestHandlerConfig,
		);
	}

	/**
	 * Handle authorization requests
	 *
	 * #### Statements
	 *
	 * - {@link "server-core/src/statements".validateRequestUri | validateRequestUri}
	 * - {@link "server-core/src/statements".validateScope | validateScope}
	 * - {@link "server-core/src/statements".validateIssuerState | validateIssuerState}
	 * - {@link "server-core/src/statements".validateResourceOwner | validateResourceOwner}
	 * - {@link "server-core/src/statements".generateAuthorizationCode | generateAuthorizationCode}
	 * - {@link "server-core/src/statements".authorizationCodeRedirection | authorizationCodeRedirection}
	 */
	get authorize() {
		validateAuthorizeHandlerConfig(this.config);

		return authorizeHandlerFactory(this.config as AuthorizeHandlerConfig);
	}

	/**
	 * Handle token requests
	 *
	 * #### Statements
	 *
	 * 1. client credentials
	 * - {@link "server-core/src/statements".validateClientCredentials | validateClientCredentials}
	 * - {@link "server-core/src/statements".validateScope | validateScope}
	 * - {@link "server-core/src/statements".generateAccessToken | generateAccessToken}
	 *
	 * 2. authorization code
	 * - {@link "server-core/src/statements".validateClientCredentials | validateClientCredentials}
	 * - {@link "server-core/src/statements".validateAuthorizationCode | validateAuthorizationCode}
	 * - {@link "server-core/src/statements".validateCodeVerifier | validateCodeVerifier}
	 * - {@link "server-core/src/statements".generateAccessToken | generateAccessToken}
	 */
	get token() {
		validateTokenHandlerConfig(this.config);

		return tokenHandlerFactory(this.config as TokenHandlerConfig);
	}

	/**
	 * Handle credential requests
	 *
	 * #### Statements
	 *
	 * - {@link "server-core/src/statements".validateAccessToken | validateAccessToken}
	 * - {@link "server-core/src/statements".validateDpop | validateDpop}
	 * - {@link "server-core/src/statements".validateProofs | validateProofs}
	 * - {@link "server-core/src/statements".generateCredentials | generateCredentials}
	 */
	get credential() {
		validateCredentialHandlerConfig(this.config);

		return credentialHandlerFactory(this.config as CredentialHandlerConfig);
	}

	/**
	 * Handle credential offer requests
	 *
	 * #### Statements
	 *
	 * - {@link "server-core/src/statements".issuerClient | issuerClient}
	 * - {@link "server-core/src/statements".validateScope | validateScope}
	 * - {@link "server-core/src/statements".generateIssuerGrants | generateIssuerGrants}
	 * - {@link "server-core/src/statements".generateCredentialOffer | generateCredentialOffer}
	 */
	get credentialOffer() {
		validateCredentialOfferHandlerConfig(this.config);

		return credentialOfferHandlerFactory(
			this.config as CredentialOfferHandlerConfig,
		);
	}

	async rotateSecret() {
		if (
			this.config.secret_ttl &&
			this.config.rotate_secret &&
			this.config.secret_base
		) {
			const base = this.config.secret_base;
			const ttl = this.config.secret_ttl;
			const now = Date.now() / 1000;
			const newSecret = await secretDerivation(base, Math.floor(now / ttl));
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
