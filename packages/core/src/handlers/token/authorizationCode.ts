import type { Request } from "express";
import { OauthError } from "../../errors";
import type { OauthClient } from "../../resources";
import {
	generateAccessToken,
	validateAuthorizationCode,
	validateClientCredentials,
} from "../../statements";

export type AuthorizationCodeHandlerConfig = {
	clients: Array<OauthClient>;
	access_token_ttl: number;
	token_encryption: string;
	secret: string;
};

export type AuthorizationCodeRequest = {
	grant_type: "authorization_code";
	client_id: string;
	client_secret: string;
	redirect_uri: string;
	code: string;
};

export type AuthorizationCodeResponse = {
	status: 200;
	body: {
		access_token: string;
		expires_in: number;
		token_type: "bearer";
	};
};

export async function handleAuthorizationCode(
	request: AuthorizationCodeRequest,
	config: AuthorizationCodeHandlerConfig,
): Promise<AuthorizationCodeResponse> {
	const { client } = await validateClientCredentials(
		{
			client_id: request.client_id,
			client_secret: request.client_secret,
			redirect_uri: request.redirect_uri,
			confidential: false,
		},
		config,
	);

	const { authorization_code, sub, scope } = await validateAuthorizationCode(
		{
			authorization_code: request.code,
			redirect_uri: request.redirect_uri,
		},
		config,
	);

	const { access_token, expires_in } = await generateAccessToken(
		{
			authorization_code,
			client,
			scope,
			sub,
		},
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

export async function validateAuthorizationCodeRequest(
	expressRequest: Request,
): Promise<AuthorizationCodeRequest> {
	const { client_id, client_secret, redirect_uri, code, grant_type } =
		expressRequest.body;

	if (!client_id) {
		throw new OauthError(
			400,
			"invalid_request",
			"client id is missing from body parameters",
		);
	}

	if (!redirect_uri) {
		throw new OauthError(
			400,
			"invalid_request",
			"redirect uri is missing from body parameters",
		);
	}

	if (!code) {
		throw new OauthError(
			400,
			"invalid_request",
			"code is missing from body parameters",
		);
	}

	return {
		client_id,
		client_secret,
		redirect_uri,
		code,
		grant_type,
	};
}
