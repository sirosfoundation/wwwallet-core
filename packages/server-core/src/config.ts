import type { EncryptConfig } from "./crypto";
import type {
	DeferredCredential,
	SupportedCredentialConfiguration,
} from "./resources";

export type BusinessEvent =
	| "authorize"
	| "authenticate"
	| "authorize_error"
	| "credential"
	| "credential_error"
	| "credential_offer"
	| "credential_offer_error"
	| "nonce"
	| "nonce_error"
	| "pushed_authorization"
	| "pushed_authorization_error"
	| "client_credentials"
	| "authorization_code"
	| "token_error";

export interface Logger {
	business: (
		event: BusinessEvent,
		data: { [key: string]: string | undefined },
	) => void;
	error: (message: string) => void;
	info: (message: string) => void;
	warn: (message: string) => void;
	debug: (message: string) => void;
}

export interface DataOperations {
	defereredResourceOwnerData?: (
		sub: string,
		vct?: string,
		config?: EncryptConfig,
	) => Promise<DeferredCredential>;
	resourceOwnerData?: (sub: string, vct?: string) => Promise<unknown>;
}

export type Config = {
	issuer_url?: string;
	wallet_url?: string;
	logger?: Logger;
	dataOperations?: DataOperations;
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
	supported_credential_configurations?: Array<SupportedCredentialConfiguration>;
	access_token_ttl?: number;
	pushed_authorization_request_ttl?: number;
	authorization_code_ttl?: number;
	issuer_state_ttl?: number;
	secret_ttl?: number;
	token_encryption?: string;
	secret?: string;
	secret_base?: string;
	previous_secrets?: Array<string>;
	rotate_secret?: boolean;
	trusted_root_certificates?: Array<string>;
	trusted_root_certificate_paths?: Array<string>;
};
