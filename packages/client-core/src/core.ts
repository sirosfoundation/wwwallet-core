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
	 * @throws {OauthError} An {@link OauthError} error
	 */
	get location() {
		validateLocationHandlerConfig(this.config);

		return locationHandlerFactory(this.config as LocationHandlerConfig);
	}

	/**
	 * @throws {OauthError} An {@link OauthError} error
	 */
	get authorization() {
		validateAuthorizationHandlerConfig(this.config);

		return authorizationHandlerFactory(
			this.config as AuthorizationHandlerConfig,
		);
	}

	/**
	 * @throws {OauthError} An {@link OauthError} error
	 */
	get credential() {
		validateCredentialHandlerConfig(this.config);

		return credentialHandlerFactory(this.config as CredentialHandlerConfig);
	}

	/**
	 * @throws {OauthError} An {@link OauthError} error
	 */
	get generatePresentation() {
		validateGeneratePresentationHandlerConfig(this.config);

		return generatePresentationHandlerFactory(
			this.config as GeneratePresentationConfig,
		);
	}

	/**
	 * @throws {OauthError} An {@link OauthError} error
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
};
