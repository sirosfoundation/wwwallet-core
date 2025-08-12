export type IssuerClient = {
	scopes: Array<string>;
};

export type OauthClient = {
	id: string;
	secret?: string;
	redirect_uris?: Array<string>;
	scopes: Array<string>;
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

export type AuthorizationServerState = {
	id: number;
	credential_configuration_ids: Array<string>;
	issuer_state: string;
	user_pin: string;
	user_pin_required: boolean;
};

export type IssuerGrants = {
	authorization_code: {
		issuer_state: string;
	};
};

export type CredentialOffer = {
	credential_issuer: string;
	credential_configuration_ids: Array<string>;
	grants: IssuerGrants;
};

export type AuthorizationRequest = {
	response_type: string;
	client_id: string;
	redirect_uri: string;
	scope?: string;
	state?: string;
	code_challenge?: string;
	code_challenge_method?: string;
};
