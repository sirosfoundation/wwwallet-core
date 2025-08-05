import { clientCredentialsFactory, credentialOfferFactory } from "./handlers";
import type { AuthorizationServerState } from "./resources";

export type Config = {
	databaseOperations: {
		insertAuthorizationServerState: (
			authorizationServerState: AuthorizationServerState,
		) => Promise<AuthorizationServerState>;
	};
	issuer_url: string;
	wallet_url: string;
	clients: Array<{ id: string; secret: string; scopes: Array<string> }>;
	access_token_ttl: number;
	access_token_encryption: string;
	secret: string;
	issuer_client: {
		scopes: Array<string>;
	};
	supported_credential_configurations: Array<{
		credential_configuration_id: string;
		scope: string;
		format: string;
		vct?: string;
	}>;
};

export class Core {
	config: Config;

	constructor(config: Config) {
		this.config = config;
	}

	get clientCredentials() {
		return clientCredentialsFactory(this.config);
	}

	get credentialOffer() {
		return credentialOfferFactory(this.config);
	}
}
