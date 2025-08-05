import { tokenHandlerFactory } from "./handlers";

export type Config = {
	clients: Array<{ id: string; secret: string; scopes: Array<string> }>;
	access_token_ttl: number;
	access_token_encryption: string;
	secret: string;
};

export class Core {
	config: Config;

	constructor(config: Config) {
		this.config = config;
	}

	get token() {
		return tokenHandlerFactory(this.config);
	}
}
