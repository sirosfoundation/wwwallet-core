import type { Request } from "express";
import { OauthError } from "../../errors";
import type { OauthClient } from "../../resources";
import {
	generateAccessToken,
	validateClientCredentials,
	validateScope,
} from "../../statements";

export type ClientCredentialsHandlerConfig = {
	clients: Array<OauthClient>;
	access_token_ttl: number;
	token_encryption: string;
	secret: string;
	previous_secrets: Array<string>;
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

export async function validateClientCredentialsRequest(
	expressRequest: Request,
): Promise<ClientCredentialsRequest> {
	const { client_id, client_secret, scope, grant_type } = expressRequest.body;

	if (!client_id) {
		throw new OauthError(
			400,
			"invalid_request",
			"client id is missing from body parameters",
		);
	}

	if (!client_secret) {
		throw new OauthError(
			400,
			"invalid_request",
			"client secret is missing from body parameters",
		);
	}

	return {
		client_id,
		client_secret,
		scope,
		grant_type,
	};
}
