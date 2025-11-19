import axios from "axios";
import { merge } from "ts-deepmerge";
import type { Config } from "./config";
import {
	type AuthorizationHandlerConfig,
	authorizationHandlerFactory,
	type CredentialHandlerConfig,
	credentialHandlerFactory,
	type GeneratePresentationConfig,
	generatePresentationHandlerFactory,
	type LocationHandlerConfig,
	locationHandlerFactory,
	type SendPresentationConfig,
	sendPresentationHandlerFactory,
	validateAuthorizationHandlerConfig,
	validateCredentialHandlerConfig,
	validateGeneratePresentationHandlerConfig,
	validateLocationHandlerConfig,
	validateSendPresentationHandlerConfig,
} from "./handlers";

/** wwWallet client Core class.
 *
 * Core is the entrypoint of OAuth 2.0 family protocols client implementation.
 * It exposes the request handlers to be used to manage protocols at client level.
 */
export class Core {
	config: Config;

	constructor(config: Config) {
		this.config = merge(defaultConfig, config);
	}

	/**
	 * Handle parse location step
	 *
	 * @throws {OauthError} An {@link OauthError} error
	 *
	 * #### Statements
	 *
	 * 1. protocol error
	 * 2. credential offer
	 * - {@link "client-core/src/statements".validateCredentialOffer | validateCredentialOffer}
	 * - {@link "client-core/src/statements".validateGrants | validateGrants}
	 * 3. authorization code
	 * - {@link "client-core/src/statements".clientState | clientState}
	 * - {@link "client-core/src/statements".issuerClient | issuerClient}
	 * - {@link "client-core/src/statements".fetchIssuerMetadata | fetchIssuerMetadata}
	 * - {@link "client-core/src/statements".generateDpop | generateDpop}
	 * - {@link "client-core/src/statements".fetchAccessToken | fetchAccessToken}
	 * - {@link "client-core/src/statements".fetchNonce | fetchNonce}
	 * 4. presentation request
	 * - {@link "client-core/src/statements".validateClientId | validateClientId}
	 * - {@link "client-core/src/statements".validateDcqlQuery | validateDcqlQuery}
	 * - {@link "client-core/src/statements".validateClientMetadata | validateClientMetadata}
	 * 5. presentation success
	 */
	get location() {
		validateLocationHandlerConfig(this.config);

		return locationHandlerFactory(this.config as LocationHandlerConfig);
	}

	/**
	 * Handle authorization request step
	 *
	 * @throws {OauthError} An {@link OauthError} error
	 *
	 * #### Statements
	 *
	 * - {@link "client-core/src/statements".issuerClient | issuerClient}
	 * - {@link "client-core/src/statements".clientState | clientState}
	 * - {@link "client-core/src/statements".fetchIssuerMetadata | fetchIssuerMetadata}
	 *
	 * 1. pushed authorizations
	 * - {@link "client-core/src/statements".fetchAuthorizationUrl | fetchAuthorizationUrl}
	 *
	 * 2. authorization challenges
	 */
	get authorization() {
		validateAuthorizationHandlerConfig(this.config);

		return authorizationHandlerFactory(
			this.config as AuthorizationHandlerConfig,
		);
	}

	/**
	 * Handle credential request step
	 *
	 * @throws {OauthError} An {@link OauthError} error
	 *
	 * #### Statements
	 *
	 * - {@link "client-core/src/statements".clientState | clientState}
	 * - {@link "client-core/src/statements".fetchIssuerMetadata | fetchIssuerMetadata}
	 * - {@link "client-core/src/statements".generateDpop | generateDpop}
	 * - {@link "client-core/src/statements".fetchCredentials | fetchCredentials}
	 */
	get credential() {
		validateCredentialHandlerConfig(this.config);

		return credentialHandlerFactory(this.config as CredentialHandlerConfig);
	}

	/**
	 * Handle generate presentation step
	 *
	 * @throws {OauthError} An {@link OauthError} error
	 *
	 * #### Statements
	 *
	 * - {@link "client-core/src/statements".generateVpToken | generateVpToken}
	 */
	get generatePresentation() {
		validateGeneratePresentationHandlerConfig(this.config);

		return generatePresentationHandlerFactory(
			this.config as GeneratePresentationConfig,
		);
	}

	/**
	 * Handle send presentation step
	 *
	 * @throws {OauthError} An {@link OauthError} error
	 *
	 * #### Statements
	 *
	 * - {@link "client-core/src/statements".presentationResponse | presentationResponse}
	 */
	get sendPresentation() {
		validateSendPresentationHandlerConfig(this.config);

		return sendPresentationHandlerFactory(
			this.config as SendPresentationConfig,
		);
	}
}

export const defaultConfig = {
	httpClient: axios,
	dpop_ttl_seconds: 60,
	static_clients: [],
};
