import type { Request } from "express";
import type { Logger } from "../../../config";
import { type DecryptConfig, jwtDecryptWithConfigKeys } from "../../../crypto";
import { OauthError } from "../../../errors";
import {
	type GenerateAccessTokenConfig,
	generateAccessToken,
	type ValidateClientCredentialsConfig,
	validateClientCredentials,
} from "../../../statements";

export type PreauthorizedCodeHandlerConfig = {
	logger: Logger;
} & ValidateClientCredentialsConfig &
	DecryptConfig &
	GenerateAccessTokenConfig;

export type PreauthorizedCodeRequest = {
	grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code";
	client_id: string;
	client_secret: string;
	redirect_uri: string;
	preauthorized_code: string;
};

export type PreauthorizedCodeResponse = {
	status: 200;
	body: {
		access_token: string;
		expires_in: number;
		token_type: "bearer";
	};
};

export async function handlePreauthorizedCode(
	request: PreauthorizedCodeRequest,
	config: PreauthorizedCodeHandlerConfig,
): Promise<PreauthorizedCodeResponse> {
	const { client } = await validateClientCredentials(
		{
			client_id: request.client_id,
			client_secret: request.client_secret,
			redirect_uri: request.redirect_uri,
			confidential: false,
		},
		config,
	);

	let scope: string;
	let sub: string;
	try {
		const {
			payload: { sub: preauthorizedSub, scope: preauthorizedScope, token_type },
		} = await jwtDecryptWithConfigKeys<{ scope: string; sub: string }>(
			request.preauthorized_code,
			config,
		);

		if (token_type !== "preauthorized_code") {
			throw new Error("preauthorized code token type is invalid");
		}

		scope = preauthorizedScope;
		sub = preauthorizedSub;
	} catch (error) {
		throw new OauthError(
			400,
			"invalid_request",
			"preauthorized code is invalid",
			{ error },
		);
	}

	const { access_token, expires_in } = await generateAccessToken(
		{
			authorization_code: request.preauthorized_code,
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

export async function validatePreauthorizedCodeRequest(
	expressRequest: Request,
): Promise<PreauthorizedCodeRequest> {
	const { client_id, client_secret, redirect_uri, grant_type } =
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

	const preauthorized_code = expressRequest.body["pre-authorized_code"];
	if (!preauthorized_code) {
		throw new OauthError(
			400,
			"invalid_request",
			"pre-authorized_code is missing from body parameters",
		);
	}

	return {
		client_id,
		client_secret,
		redirect_uri,
		preauthorized_code,
		grant_type,
	};
}
