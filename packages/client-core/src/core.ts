import axios from "axios";
import { merge } from "ts-deepmerge";
import type { Config } from "./config";
import {
	type LocationHandlerConfig,
	locationHandlerFactory,
	type PushedAuthorizationRequestHandlerConfig,
	pushedAuthorizationRequestHandlerFactory,
	validateLocationHandlerConfig,
	validatePushedAuthorizationRequestHandlerConfig,
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

	get pushedAuthorizationRequest() {
		validatePushedAuthorizationRequestHandlerConfig(this.config);

		return pushedAuthorizationRequestHandlerFactory(
			this.config as PushedAuthorizationRequestHandlerConfig,
		);
	}
}

export const defaultConfig = {
	httpClient: axios,
};
