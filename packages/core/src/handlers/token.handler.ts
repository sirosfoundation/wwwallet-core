import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import { tokenHandlerConfigSchema } from "./schemas/tokenHandlerConfig.schema";
import {
	type AuthorizationCodeRequest,
	handleAuthorizationCode,
	validateAuthorizationCodeRequest,
} from "./token/authorizationCode";
import {
	type ClientCredentialsRequest,
	handleClientCredentials,
	validateClientCredentialsRequest,
} from "./token/clientCredentials";

const ajv = new Ajv();

export type TokenHandlerConfig = {
	logger: Logger;
	clients: Array<{ id: string; secret: string; scopes: Array<string> }>;
	access_token_ttl: number;
	token_encryption: string;
	secret: string;
	previous_secrets: Array<string>;
};

type TokenResponse = {
	status: 200;
	body: {
		access_token: string;
		expires_in: number;
		token_type: "bearer";
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
): Promise<ClientCredentialsRequest | AuthorizationCodeRequest> {
	if (!expressRequest.body) {
		throw new OauthError(
			400,
			"invalid_request",
			"client credentials requests require a body",
		);
	}

	if (expressRequest.body.grant_type === "client_credentials") {
		return validateClientCredentialsRequest(expressRequest);
	}

	if (expressRequest.body.grant_type === "authorization_code") {
		return validateAuthorizationCodeRequest(expressRequest);
	}

	throw new OauthError(400, "invalid_request", "grant_type is not supported");
}
