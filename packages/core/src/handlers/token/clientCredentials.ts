import type { Request } from "express";
import type { Logger } from "../../config";
import { OauthError } from "../../errors";
import {
	type GenerateAccessTokenConfig,
	generateAccessToken,
	type ValidateClientCredentialsConfig,
	validateClientCredentials,
	validateScope,
} from "../../statements";

export type ClientCredentialsHandlerConfig = {
	logger: Logger;
} & ValidateClientCredentialsConfig &
	GenerateAccessTokenConfig;

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

	config.logger.business("client_credentials", {
		client_id: client.id,
		access_token,
		expires_in: expires_in.toString(),
	});

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
