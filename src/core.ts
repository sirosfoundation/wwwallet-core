import { merge } from "ts-deepmerge";
import {
	type ClientCredentialsConfig,
	clientCredentialsFactory,
	validateClientCredentialsConfig,
} from "./handlers";

export type Config = {
	clients?: Array<{ id: string; secret: string; scopes: Array<string> }>;
	access_token_ttl?: number;
	access_token_encryption?: string;
	secret?: string;
};

export class Core {
	config: Config;

	constructor(config: Config) {
		this.config = merge(defaultConfig, config);
	}

	get clientCredentials() {
		validateClientCredentialsConfig(this.config);

		return clientCredentialsFactory(this.config as ClientCredentialsConfig);
	}
}

export const defaultConfig = {
	clients: [],
	access_token_ttl: 3600 * 2,
	access_token_encryption: "A128CBC-HS256", // see https://github.com/panva/jose/issues/210#jwe-enc
};
