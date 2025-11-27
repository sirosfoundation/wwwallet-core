import type { JWK } from "jose";

export type BearerCredentials = {
	access_token?: string;
	dpop?: string | string[];
	dpopRequest?: {
		method: string;
		uri: string;
	};
};

export type IssuerClient = {
	id: string;
	scopes: Array<string>;
};

export type OauthClient = {
	id: string;
	secret?: string;
	redirect_uris?: Array<string>;
	scopes: Array<string>;
};

export type SupportedCredentialConfiguration = {
	deferred?: boolean;
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
};

export type CredentialConfiguration = {
	credential_configuration_id: string;
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
};

export type OauthScope = string;

export type IssuerGrants = {
	authorization_code: {
		issuer_state: string;
	};
};

export type ResourceOwner = {
	sub: string | null;
	username?: string;
};

export type ResourceOwnerData = {
	claims?: Claims;
	credential_configuration: SupportedCredentialConfiguration;
};

export type CredentialOffer = {
	credential_issuer: string;
	credential_configuration_ids: Array<string>;
	grants: IssuerGrants;
};

export type Claims = {
	[key: string]: unknown | Claims;
};

export type DeferredCredential = {
	transaction_id: string;
	interval?: number;
};

export type DeferredResourceOwnerData = {
	sub: string;
	jwks: Array<JWK>;
	data: Array<ResourceOwnerData>;
};

export type AuthorizationRequest = {
	response_type: string;
	client_id: string;
	redirect_uri: string;
	scope?: string;
	state?: string;
	code_challenge?: string;
	code_challenge_method?: string;
	issuer_state?: string;
};

export type AccessToken = {
	token_type: "access_token";
	previous_code?: string;
	access_token?: string;
	client_id: string;
	sub: string;
	scope: string;
};

export type AuthorizationCode = {
	token_type: "authorization_code";
	authorization_code?: string;
	redirect_uri: string;
	sub: string;
	scope: string;
	code_challenge?: string;
	code_challenge_method?: string;
};

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
		jwt?: {
			proof_signing_alg_values_supported: Array<string>;
		};
		attestation?: {
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
	deferred_credential_endpoint: string;
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
