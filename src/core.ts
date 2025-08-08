import { merge } from "ts-deepmerge";
import { v6 as uuidv6 } from "uuid";
import {
	type CredentialOfferHandlerConfig,
	credentialOfferHandlerFactory,
	type TokenHandlerConfig,
	tokenHandlerFactory,
	validateCredentialOfferHandlerConfig,
	validateTokenHandlerConfig,
} from "./handlers";
import type { AuthorizationServerState } from "./resources";

type Logger = {
	error: (message: string) => void;
	info: (message: string) => void;
	warn: (message: string) => void;
	debug: (message: string) => void;
};

export type Config = {
	logger: Logger;
	databaseOperations?: {
		insertAuthorizationServerState?: (
			authorizationServerState: AuthorizationServerState,
		) => Promise<AuthorizationServerState>;
	};
	tokenGenerators?: {
		generateIssuerState?: () => string;
	};
	issuer_url?: string;
	wallet_url?: string;
	clients?: Array<{ id: string; secret: string; scopes: Array<string> }>;
	issuer_client?: {
		scopes: Array<string>;
	};
	supported_credential_configurations?: Array<{
		credential_configuration_id: string;
		label?: string;
		scope: string;
		format: string;
		vct?: string;
	}>;
	access_token_ttl?: number;
	access_token_encryption?: string;
	secret?: string;
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
		validateCredentialOfferHandlerConfig(this.config);

		return credentialOfferHandlerFactory(
			this.config as CredentialOfferHandlerConfig,
		);
	}
}

export const defaultConfig = {
	logger: console,
	clients: [],
	access_token_ttl: 3600 * 2,
	access_token_encryption: "A128CBC-HS256", // see https://github.com/panva/jose/issues/210#jwe-enc
	databaseOperations: {},
	tokenGenerators: {
		generateIssuerState: uuidv6,
	},
	issuer_client: {
		scopes: [],
	},
	supported_credential_configurations: [],
};
