import type { Request } from "express";
import type { Logger } from "../../../config";
import { OauthError } from "../../../errors";
import {
	type GenerateAccessTokenConfig,
	type GenerateRefreshTokenConfig,
	generateAccessToken,
	generateRefreshToken,
	type ValidateClientCredentialsConfig,
	type ValidateRefreshTokenConfig,
	validateClientCredentials,
	validateRefreshToken,
	validateScope,
} from "../../../statements";

export type RefreshTokenHandlerConfig = {
	logger: Logger;
} & ValidateClientCredentialsConfig &
	ValidateRefreshTokenConfig &
	GenerateAccessTokenConfig &
	GenerateRefreshTokenConfig;

export type RefreshTokenRequest = {
	grant_type: "refresh_token";
	client_id: string;
	client_secret: string;
	refresh_token: string;
	scope?: string;
};

export type RefreshTokenResponse = {
	status: 200;
	body: {
		access_token: string;
		refresh_token: string;
		expires_in: number;
		token_type: "bearer";
	};
};

export async function handleRefreshToken(
	request: RefreshTokenRequest,
	config: RefreshTokenHandlerConfig,
): Promise<RefreshTokenResponse> {
	const { client } = await validateClientCredentials(
		{
			client_id: request.client_id,
			client_secret: request.client_secret,
		},
		config,
	);

	const {
		client_id,
		sub,
		scope: previousScope,
	} = await validateRefreshToken(
		{
			refresh_token: request.refresh_token,
		},
		config,
	);

	if (client.id !== client_id) {
		throw new OauthError(400, "invalid_request", "refresh token is invalid");
	}

	let scope = previousScope;
	if (request.scope) {
		const { scope: requestedScope } = await validateScope(
			request.scope,
			{ client },
			config,
		);
		const previousScopes = previousScope.split(" ");
		const requestedScopes = requestedScope.split(" ");
		if (
			requestedScopes.some((tokenScope) => !previousScopes.includes(tokenScope))
		) {
			throw new OauthError(400, "invalid_request", "invalid scope");
		}
		scope = requestedScope;
	}

	const { access_token, expires_in } = await generateAccessToken(
		{
			client,
			scope,
			sub,
		},
		config,
	);

	const { refresh_token } = await generateRefreshToken(
		{
			client,
			scope,
			sub,
		},
		config,
	);

	config.logger.business("refresh_token", {
		client_id: client.id,
		sub,
		access_token,
		refresh_token,
		expires_in: expires_in.toString(),
	});

	return {
		status: 200,
		body: {
			access_token,
			refresh_token,
			expires_in,
			token_type: "bearer",
		},
	};
}

export async function validateRefreshTokenRequest(
	expressRequest: Request,
): Promise<RefreshTokenRequest> {
	const { client_id, client_secret, refresh_token, scope, grant_type } =
		expressRequest.body;

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

	if (!refresh_token) {
		throw new OauthError(
			400,
			"invalid_request",
			"refresh_token is missing from body parameters",
		);
	}

	return {
		client_id,
		client_secret,
		refresh_token,
		scope,
		grant_type,
	};
}
