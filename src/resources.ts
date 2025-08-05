export type IssuerClient = {
	scopes: Array<string>;
};

export type OauthClient = {
	id: string;
	secret: string;
	scopes: Array<string>;
};

export type OauthScope = string;

export type AuthorizationServerState = {
	user_pin: string;
	user_pin_required: boolean;
	issuer_state: string;
	credential_configuration_ids: Array<string>;
};
