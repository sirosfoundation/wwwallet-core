import { merge } from "ts-deepmerge";
import type { Config } from "./config";
import {
	type GetEventsHandlerConfig,
	getEventsHandlerFactory,
	validateGetEventsHandlerConfig,
} from "./handlers";

/** wwWallet server core Storage class.
 *
 * Core Storage is the entrypoint for wallet events encrypted storage
 */
export class Storage {
	config: Config;

	constructor(config: Config) {
		this.config = merge(defaultConfig, config);
	}

	/**
	 * Handle well-known oauth-authorization-server requests
	 */
	get getEvents() {
		validateGetEventsHandlerConfig(this.config);

		return getEventsHandlerFactory(this.config as GetEventsHandlerConfig);
	}
}

const defaultConfig = {
	events_path: "./events",
};
