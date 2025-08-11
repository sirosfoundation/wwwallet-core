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
		display: Array<{
			name: string;
			description?: string;
			background_image?: {
				uri: string;
			};
			background_color?: string;
			text_color?: string;
			locale: string;
		}>;
	}>;
	access_token_ttl?: number;
	access_token_encryption?: string;
	secret?: string;
};
