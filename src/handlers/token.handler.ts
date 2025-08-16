import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import { tokenHandlerConfigSchema } from "./schemas/tokenHandlerConfig.schema";
import {
	type ClientCredentialsRequest,
	handleClientCredentials,
} from "./token/clientCredentials";

const ajv = new Ajv();

export type TokenHandlerConfig = {
	clients: Array<{ id: string; secret: string; scopes: Array<string> }>;
	access_token_ttl: number;
	token_encryption: string;
	secret: string;
};

type AuthorizationCodeRequest = {
	grant_type: "authorization_code";
	client_id: string;
	client_secret: string;
	redirect_uri: string;
	code: string;
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
				throw new OauthError(
					400,
					"invalid_request",
					"grant type is not supported",
				);
			}

			throw new OauthError(
				400,
				"invalid_request",
				"grant type is not supported",
			);
		} catch (error) {
			if (error instanceof OauthError) {
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
			"client credentials requests requires a body",
		);
	}

	if (expressRequest.body.grant_type === "client_credentials") {
		return validateClientCredentialsRequest(expressRequest);
	}

	if (expressRequest.body.grant_type === "authorization_code") {
		return validateAuthrizationCodeRequest(expressRequest);
	}

	throw new OauthError(400, "invalid_request", "grant_type is not supported");
}

async function validateClientCredentialsRequest(
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

async function validateAuthrizationCodeRequest(
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
