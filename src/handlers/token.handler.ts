import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import {
	generateAccessToken,
	validateClientCredentials,
	validateScope,
} from "../statements";
import { tokenHandlerConfigSchema } from "./schemas/tokenHandlerConfig.schema";

const ajv = new Ajv();

export type TokenHandlerConfig = {
	clients: Array<{ id: string; secret: string; scopes: Array<string> }>;
	access_token_ttl: number;
	access_token_encryption: string;
	secret: string;
};

type ClientCredentialsRequest = {
	client_id: string;
	client_secret: string;
	scope?: string;
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

			const { client } = await validateClientCredentials(
				{
					client_id: request.client_id,
					client_secret: request.client_secret,
				},
				config,
			);

			const { scope } = await validateScope(request.scope, { client }, config);

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
): Promise<ClientCredentialsRequest> {
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

	throw new OauthError(400, "invalid_request", "grant_type is not supported");
}

async function validateClientCredentialsRequest(
	expressRequest: Request,
): Promise<ClientCredentialsRequest> {
	const { client_id, client_secret, scope } = expressRequest.body;

	if (!client_id) {
		throw new OauthError(
			400,
			"invalid_request",
			"client_id is missing from body params",
		);
	}

	if (!client_secret) {
		throw new OauthError(
			400,
			"invalid_request",
			"client_secret is missing from body params",
		);
	}

	return {
		client_id,
		client_secret,
		scope,
	};
}
