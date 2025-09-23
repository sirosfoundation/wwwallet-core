import axios from "axios";
import { merge } from "ts-deepmerge";
import type { Config } from "./config";
import {
	type AuthorizationHandlerConfig,
	authorizationHandlerFactory,
	type CredentialHandlerConfig,
	credentialHandlerFactory,
	type LocationHandlerConfig,
	locationHandlerFactory,
	validateAuthorizationHandlerConfig,
	validateCredentialHandlerConfig,
	validateLocationHandlerConfig,
} from "./handlers";

export class Core {
	config: Config;

	constructor(config: Config) {
		this.config = merge(defaultConfig, config);
	}

	get location() {
		validateLocationHandlerConfig(this.config);

		return locationHandlerFactory(this.config as LocationHandlerConfig);
	}

	get authorization() {
		validateAuthorizationHandlerConfig(this.config);

		return authorizationHandlerFactory(
			this.config as AuthorizationHandlerConfig,
		);
	}

	get credential() {
		validateCredentialHandlerConfig(this.config);

		return credentialHandlerFactory(this.config as CredentialHandlerConfig);
	}
}

export const defaultConfig = {
	httpClient: axios,
};
