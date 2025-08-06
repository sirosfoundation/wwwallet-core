export type IssuerClient = {
	scopes: Array<string>;
};

export type OauthClient = {
	id: string;
	secret: string;
	scopes: Array<string>;
};

export type CredentialConfiguration = {
	credential_configuration_id: string;
	scope: string;
	format: string;
	vct?: string;
};

export type OauthScope = string;

export type AuthorizationServerState = {
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
