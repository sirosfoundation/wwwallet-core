import {
	generateAccessToken,
	validateClientCredentials,
	validateScope,
} from "../../statements";

export type ClientCredentialsHandlerConfig = {
	clients: Array<{ id: string; secret: string; scopes: Array<string> }>;
	access_token_ttl: number;
	token_encryption: string;
	secret: string;
};

export type ClientCredentialsRequest = {
	grant_type: "client_credentials";
	client_id: string;
	client_secret: string;
	scope?: string;
};

export type ClientCredentialsResponse = {
	status: 200;
	body: {
		access_token: string;
		expires_in: number;
		token_type: "bearer";
	};
};

export async function handleClientCredentials(
	request: ClientCredentialsRequest,
	config: ClientCredentialsHandlerConfig,
): Promise<ClientCredentialsResponse> {
	const { client } = await validateClientCredentials(
		{
			client_id: request.client_id,
			client_secret: request.client_secret,
		},
		config,
	);

	const { scope } = await validateScope(
		request.scope,
		{
			client,
		},
		config,
	);

	const { access_token, expires_in } = await generateAccessToken(
		{ client, scope },
		config,
	);

	return {
		status: 200,
		body: {
			access_token,
			expires_in,
			token_type: "bearer",
		},
	};
}
