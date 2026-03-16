import type { Request } from "express";
import type { Logger } from "../../../config";
import { OauthError } from "../../../errors";
import {
	type GenerateAccessTokenConfig,
	type GenerateIdTokenConfig,
	type GenerateRefreshTokenConfig,
	generateAccessToken,
	generateIdToken,
	generateRefreshToken,
	type ValidateAuthorizationCodeConfig,
	type ValidateClientCredentialsConfig,
	validateAuthorizationCode,
	validateClientCredentials,
	validateCodeVerifier,
} from "../../../statements";

export type AuthorizationCodeHandlerConfig = {
	logger: Logger;
} & ValidateClientCredentialsConfig &
	ValidateAuthorizationCodeConfig &
	GenerateAccessTokenConfig &
	GenerateRefreshTokenConfig &
	GenerateIdTokenConfig;

export type AuthorizationCodeRequest = {
	grant_type: "authorization_code";
	client_id?: string;
	client_secret?: string;
	redirect_uri: string;
	oauth_client_attestation?: string;
	code: string;
	code_verifier: string | undefined;
};

export type AuthorizationCodeResponse = {
	status: 200;
	body: {
		access_token: string;
		refresh_token: string;
		expires_in: number;
		token_type: "bearer";
		id_token?: string;
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
			oauth_client_attestation: request.oauth_client_attestation,
			confidential: false,
		},
		config,
	);

	const {
		authorization_code,
		nonce,
		code_challenge,
		code_challenge_method,
		sub,
		scope,
	} = await validateAuthorizationCode(
		{
			authorization_code: request.code,
			redirect_uri: request.redirect_uri,
			client: client,
		},
		config,
	);

	await validateCodeVerifier(
		{
			code_challenge,
			code_challenge_method,
			code_verifier: request.code_verifier,
		},
		config,
	);

	const { access_token, expires_in } = await generateAccessToken(
		{
			authorization_code,
			client,
			scope: scope || "",
			sub,
		},
		config,
	);
	const { refresh_token } = await generateRefreshToken(
		{
			client,
			scope: scope || "",
			sub,
		},
		config,
	);
	const isOpenidScopeRequested = (scope || "").split(" ").includes("openid");
	const { id_token } = isOpenidScopeRequested
		? await generateIdToken(
				{
					client_id: client.id,
					sub,
					nonce,
					access_token,
				},
				config,
			)
		: { id_token: undefined };

	config.logger.business("authorization_code", {
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
			id_token,
		},
	};
}

export async function validateAuthorizationCodeRequest(
	expressRequest: Request,
): Promise<AuthorizationCodeRequest> {
	const {
		client_id,
		client_secret,
		redirect_uri,
		code,
		code_verifier,
		grant_type,
	} = expressRequest.body;

	let oauth_client_attestation: string | undefined;
	if (Array.isArray(expressRequest.headers["oauth-client-attestation"])) {
		if (expressRequest.headers["oauth-client-attestation"].length > 1) {
			throw new OauthError(
				400,
				"invalid_request",
				"oauth-client-attestation header is invalid",
			);
		}
		oauth_client_attestation =
			expressRequest.headers["oauth-client-attestation"][0];
	} else {
		oauth_client_attestation =
			expressRequest.headers["oauth-client-attestation"];
	}
	if (oauth_client_attestation?.includes(",")) {
		throw new OauthError(
			400,
			"invalid_request",
			"oauth-client-attestation header is invalid",
		);
	}

	if (typeof code !== "string" || code.trim().length === 0) {
		throw new OauthError(
			400,
			"invalid_request",
			"code is missing from body parameters",
		);
	}

	if (typeof redirect_uri !== "string" || redirect_uri.trim().length === 0) {
		throw new OauthError(
			400,
			"invalid_request",
			"redirect_uri is missing from body parameters",
		);
	}
	if (client_id !== undefined && typeof client_id !== "string") {
		throw new OauthError(400, "invalid_request", "client id is invalid");
	}
	if (client_secret !== undefined && typeof client_secret !== "string") {
		throw new OauthError(400, "invalid_request", "client secret is invalid");
	}
	if (code_verifier !== undefined && typeof code_verifier !== "string") {
		throw new OauthError(400, "invalid_request", "code_verifier is invalid");
	}

	return {
		client_id,
		client_secret,
		redirect_uri,
		oauth_client_attestation,
		code,
		code_verifier,
		grant_type,
	};
}
