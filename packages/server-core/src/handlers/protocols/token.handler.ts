import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import { validateGrantType } from "../../statements";
import { tokenHandlerConfigSchema } from "./schemas";
import {
	type AuthorizationCodeHandlerConfig,
	type AuthorizationCodeRequest,
	handleAuthorizationCode,
	validateAuthorizationCodeRequest,
} from "./token/authorizationCode";
import {
	type ClientCredentialsHandlerConfig,
	type ClientCredentialsRequest,
	handleClientCredentials,
	validateClientCredentialsRequest,
} from "./token/clientCredentials";
import {
	handleRefreshToken,
	type RefreshTokenHandlerConfig,
	type RefreshTokenRequest,
	validateRefreshTokenRequest,
} from "./token/refreshToken";

const ajv = new Ajv();

export type TokenHandlerConfig = {
	logger: Logger;
} & ClientCredentialsHandlerConfig &
	AuthorizationCodeHandlerConfig &
	RefreshTokenHandlerConfig;

export type TokenResponse = {
	status: 200;
	body: {
		access_token: string;
		expires_in: number;
		token_type: "bearer";
		id_token?: string;
		refresh_token?: string;
	};
};

export function tokenHandlerFactory(config: TokenHandlerConfig) {
	return async function tokenHandler(
		expressRequest: Request,
	): Promise<TokenResponse | OauthErrorResponse> {
		try {
			const request = await validateRequest(expressRequest);

			if (request.grant_type === "client_credentials") {
				return await handleClientCredentials(request, config);
			}

			if (request.grant_type === "authorization_code") {
				return await handleAuthorizationCode(request, config);
			}

			if (request.grant_type === "refresh_token") {
				return await handleRefreshToken(request, config);
			}

			throw new OauthError(
				400,
				"invalid_request",
				"grant type is not supported",
			);
		} catch (error) {
			if (error instanceof OauthError) {
				config.logger.business("token_error", { error: error.message });

				return error.toResponse();
			}

			throw error;
		}
	};
}

export function validateTokenHandlerConfig(config: Config) {
	const validate = ajv.compile(tokenHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate token handler configuration - ${errorText}`,
		);
	}
}

async function validateRequest(
	expressRequest: Request,
): Promise<
	ClientCredentialsRequest | AuthorizationCodeRequest | RefreshTokenRequest
> {
	if (!expressRequest.body) {
		throw new OauthError(
			400,
			"invalid_request",
			"client credentials requests require a body",
		);
	}

	const { grant_type } = await validateGrantType({
		grant_type: expressRequest.body.grant_type,
	});

	if (grant_type === "client_credentials") {
		return validateClientCredentialsRequest(expressRequest);
	}

	if (grant_type === "authorization_code") {
		return validateAuthorizationCodeRequest(expressRequest);
	}

	if (grant_type === "refresh_token") {
		return validateRefreshTokenRequest(expressRequest);
	}
	throw new OauthError(400, "invalid_request", "grant_type is not supported");
}
