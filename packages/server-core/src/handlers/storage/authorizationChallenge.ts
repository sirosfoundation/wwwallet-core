import Ajv from "ajv";
import type { Request } from "express";
import { importJWK, type JWK, type JWTPayload } from "jose";
import type { Config } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import {
	type GenerateAuthorizationChallengeConfig,
	generateAuthorizationChallenge,
} from "../../statements";
import { authorizationChallengeHandlerConfigSchema } from "./schemas/authorizationChallengeHandlerConfig.schema";

const ajv = new Ajv();

export type AuthorizationChallengeConfig = GenerateAuthorizationChallengeConfig;

type AuthorizationChallengeRequest = {
	jwk: JWK;
};

type AuthorizationChallengeResponse = {
	status: 200;
	data: {};
	body: {
		challenge: string;
	};
};

export function authorizationChallengeHandlerFactory(
	config: AuthorizationChallengeConfig,
) {
	return async function authorizationChallengeHandler(
		expressRequest: Request,
		tokenPayload: JWTPayload = {},
	): Promise<AuthorizationChallengeResponse | OauthErrorResponse> {
		try {
			const request = await validateRequest(expressRequest);

			const { challenge } = await generateAuthorizationChallenge(
				{
					jwk: request.jwk,
					tokenPayload,
				},
				config,
			);

			return {
				status: 200,
				data: {},
				body: { challenge },
			};
		} catch (error) {
			if (error instanceof OauthError) {
				const data = errorData(expressRequest);
				return error.toResponse(data);
			}

			throw error;
		}
	};
}

export function validateAuthorizationChallengeConfig(config: Config) {
	const validate = ajv.compile(authorizationChallengeHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}

async function validateRequest(
	expressRequest: Request,
): Promise<AuthorizationChallengeRequest> {
	if (expressRequest.headers["content-type"] !== "application/jwk+json") {
		throw new OauthError(
			400,
			"invalid_request",
			"application/jwk+json body is required",
		);
	}

	const jwk = expressRequest.body;

	try {
		await importJWK(jwk, "ECDH-ES");
	} catch (error) {
		throw new OauthError(
			400,
			"invalid_request",
			(error as Error).message.toLowerCase(),
		);
	}

	return { jwk };
}

function errorData(expressRequest: Request) {
	return { body: expressRequest.body };
}
