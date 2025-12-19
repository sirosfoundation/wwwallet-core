import { merge } from "ts-deepmerge";
import type { Config } from "./config";
import {
	type AuthorizationChallengeConfig,
	authorizationChallengeHandlerFactory,
	type GetEventsHandlerConfig,
	getEventsHandlerFactory,
	validateAuthorizationChallengeConfig,
	validateGetEventsHandlerConfig,
} from "./handlers";
import {
	type StoreEventHandlerConfig,
	storeEventHandlerFactory,
	validateStoreEventHandlerConfig,
} from "./handlers/storage/storeEvent";

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
	 * Handle get events requests
	 *
	 * #### Statements
	 *
	 * - {@link "server-core/src/statements".validateStorageToken | validateStorageToken}
	 * - {@link "server-core/src/statements".validateDpop | validateDpop}
	 * - {@link "server-core/src/statements".fetchEvents | fetchEvents}
	 */
	get getEvents() {
		validateGetEventsHandlerConfig(this.config);

		return getEventsHandlerFactory(this.config as GetEventsHandlerConfig);
	}

	/**
	 * Handle store event requests
	 *
	 * #### Statements
	 *
	 * - {@link "server-core/src/statements".validateStorageToken | validateStorageToken}
	 * - {@link "server-core/src/statements".validateDpop | validateDpop}
	 * - {@link "server-core/src/statements".storeEvent | storeEvent}
	 */
	get storeEvent() {
		validateStoreEventHandlerConfig(this.config);

		return storeEventHandlerFactory(this.config as StoreEventHandlerConfig);
	}

	/**
	 * Handle authorization challenge requests
	 *
	 * #### Statements
	 *
	 * - {@link "server-core/src/statements".generateAuthorizationChallenge | generateAuthorizationChallenge}
	 */
	get authorizationChallenge() {
		validateAuthorizationChallengeConfig(this.config);

		return authorizationChallengeHandlerFactory(
			this.config as AuthorizationChallengeConfig,
		);
	}
}

const defaultConfig = {
	access_token_ttl: 60,
	authorization_challenge_ttl: 60,
	events_path: "./events",
	event_tables_path: "./events",
};
