import { merge } from "ts-deepmerge";
import {
	credentialOfferHandlerFactory,
	type TokenHandlerConfig,
	tokenHandlerFactory,
	validateTokenHandlerConfig,
} from "./handlers";
import type { AuthorizationServerState } from "./resources";

export type Config = {
	databaseOperations: {
		insertAuthorizationServerState: (
			authorizationServerState: AuthorizationServerState,
		) => Promise<AuthorizationServerState>;
	};
	tokenGenerators: {
		issuerState: () => string;
	};
	clients?: Array<{ id: string; secret: string; scopes: Array<string> }>;
	access_token_ttl?: number;
	access_token_encryption?: string;
	secret?: string;
	issuer_url: string;
	wallet_url: string;
	issuer_client: {
		scopes: Array<string>;
	};
	supported_credential_configurations: Array<{
		credential_configuration_id: string;
		label?: string;
		scope: string;
		format: string;
		vct?: string;
	}>;
};

export class Core {
	config: Config;

	constructor(config: Config) {
		this.config = merge(defaultConfig, config);
	}

	get token() {
		validateTokenHandlerConfig(this.config);

		return tokenHandlerFactory(this.config as TokenHandlerConfig);
	}

	get credentialOffer() {
		return credentialOfferHandlerFactory(this.config);
	}
}

export const defaultConfig = {
	clients: [],
	access_token_ttl: 3600 * 2,
	access_token_encryption: "A128CBC-HS256", // see https://github.com/panva/jose/issues/210#jwe-enc
};
