import { merge } from "ts-deepmerge";
import type { Config } from "./config";
import {
	type LocationHandlerConfig,
	locationHandlerFactory,
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
}

export const defaultConfig = {};
