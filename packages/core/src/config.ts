import type { AuthorizationServerState } from "./resources";

export interface Logger {
	error: (message: string) => void;
	info: (message: string) => void;
	warn: (message: string) => void;
	debug: (message: string) => void;
}

export type Config = {
	issuer_url: string;
	wallet_url?: string;
	logger?: Logger;
	databaseOperations?: {
		insertAuthorizationServerState?: (
			authorizationServerState: AuthorizationServerState,
		) => Promise<AuthorizationServerState>;
		resourceOwnerData?: (sub: string, vct?: string) => Promise<unknown>;
	};
	issuer_display?: Array<{
		locale?: string;
		logo?: {
			uri: string;
		};
		name: string;
	}>;
	clients?: Array<{
		id: string;
		secret?: string;
		redirect_uris?: Array<string>;
		scopes: Array<string>;
	}>;
	issuer_client?: {
		id?: string;
		scopes: Array<string>;
	};
	supported_credential_configuration_paths?: Array<string>;
	supported_credential_configurations?: Array<{
		credential_configuration_id: string;
		label?: string;
		scope: string;
		format: string;
		vct?: string;
		doctype?: string;
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
	pushed_authorization_request_ttl?: number;
	authorization_code_ttl?: number;
	issuer_state_ttl?: number;
	secret_ttl?: number;
	token_encryption?: string;
	secret?: string;
	previous_secrets: Array<string>;
	rotate_secret?: boolean;
	trusted_root_certificates?: Array<string>;
	trusted_root_certificate_paths?: Array<string>;
};
