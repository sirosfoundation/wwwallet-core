export type OauthClient = {
	issuer: string;
	client_id: string;
};

export interface ClientState {
	issuer: string;
	issuer_state: string;
	state: string;
	code_verifier: string;
	credential_configuration_ids?: Array<string>;
	issuer_metadata?: IssuerMetadata;
	context?: unknown;
}

export type CredentialConfigurationSupported = {
	format: string;
	vct?: string;
	doctype?: string;
	scope: string;
	description?: string;
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
	cryptographic_binding_methods_supported: Array<string>;
	credential_signing_alg_values_supported: Array<string>;
	proof_types_supported: {
		jwt: {
			proof_signing_alg_values_supported: Array<string>;
		};
		attestation: {
			proof_signing_alg_values_supported: Array<string>;
			key_attestations_required: {};
		};
	};
};

export type CredentialConfigurationsSupported = {
	[credential_configuration_id: string]: CredentialConfigurationSupported;
};

export type OpenidCredentialIssuer = {
	credential_issuer: string;
	nonce_endpoint: string;
	credential_endpoint: string;
	display: Array<{
		locale: string;
		logo?: {
			uri: string;
		};
		name?: string;
	}>;
	credential_configurations_supported: CredentialConfigurationsSupported;
	signed_metadata?: string;
};

export type OauthAuthorizationServer = {
	issuer: string;
	authorization_endpoint: string;
	authorization_challenge_endpoint: string;
	token_endpoint: string;
	pushed_authorization_request_endpoint: string;
	require_pushed_authorization_requests: boolean;
	token_endpoint_auth_methods_supported: Array<string>;
	response_types_supported: Array<string>;
	code_challenge_methods_supported: Array<string>;
	dpop_signing_alg_values_supported: Array<string>;
	grant_types_supported: Array<string>;
	jwks_uri: string;
	scopes_supported: Array<string>;
};

export type IssuerMetadata = OpenidCredentialIssuer & OauthAuthorizationServer;

export type Grants = {
	authorization_code?: {
		issuer_state?: string;
	};
};
