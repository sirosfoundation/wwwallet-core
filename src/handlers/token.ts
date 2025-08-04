import type { Request } from "express";
import type { Config } from "..";
import { OauthError } from "../errors";
import {
	checkClientCredentials,
	checkScope,
	generateAccessToken,
} from "../statements";

type ClientCredentialsRequest = {
	client_id: string;
	client_secret: string;
	scope?: string;
};

export function tokenFactory(config: Config) {
	return async function token(expressRequest: Request) {
		try {
			const request = await validateRequest(expressRequest);

			const { client } = await checkClientCredentials(
				{
					client_id: request.client_id,
					client_secret: request.client_secret,
				},
				config,
			);

			const { scope } = await checkScope(request.scope, { client }, config);

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

async function validateRequest(
	expressRequest: Request,
): Promise<ClientCredentialsRequest> {
	if (!expressRequest.body) {
		throw new OauthError(
			400,
			"bad_request",
			"client credentials requests requires a body",
		);
	}

	if (expressRequest.body.grant_type === "client_credentials") {
		return validateClientCredentialsRequest(expressRequest);
	}

	throw new OauthError(400, "bad_request", "grant_type is not supported");
}

async function validateClientCredentialsRequest(
	expressRequest: Request,
): Promise<ClientCredentialsRequest> {
	const { client_id, client_secret, scope } = expressRequest.body;

	if (!client_id) {
		throw new OauthError(
			400,
			"bad_request",
			"client_id is missing from body params",
		);
	}

	if (!client_secret) {
		throw new OauthError(
			400,
			"bad_request",
			"client_secret is missing from body params",
		);
	}

	return {
		client_id,
		client_secret,
		scope,
	};
}
