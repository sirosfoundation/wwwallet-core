import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import {
	type ValidateAccessTokenConfig,
	type ValidateDpopConfig,
	validateAccessToken,
	validateDpop,
} from "../../statements";
import { userinfoHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type UserinfoHandlerConfig = {
	logger: Logger;
} & ValidateAccessTokenConfig &
	ValidateDpopConfig;

export type UserinfoResponse = {
	status: 200;
	body: {
		sub: string;
	};
};

export function userinfoHandlerFactory(config: UserinfoHandlerConfig) {
	return async function userinfoHandler(
		expressRequest: Request,
	): Promise<UserinfoResponse | OauthErrorResponse> {
		try {
			const request = await validateRequest(expressRequest);
			const { sub, scope, access_token } = await validateAccessToken(
				{
					token_type: request.token_type,
					access_token: request.access_token,
				},
				config,
			);
			if (request.token_type?.toLowerCase() === "dpop" || request.dpop) {
				await validateDpop(
					{
						token_type: request.token_type,
						access_token,
						dpop: request.dpop,
						dpopRequest: {
							method: request.method,
							uri: request.uri,
						},
					},
					config,
				);
			}

			if (!scope.split(" ").includes("openid")) {
				throw new OauthError(
					401,
					"invalid_request",
					"openid scope is required",
				);
			}

			config.logger.business("userinfo", {
				sub,
			});

			return {
				status: 200,
				body: {
					sub,
				},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				config.logger.business("userinfo_error", { error: error.message });
				return error.toResponse();
			}

			throw error;
		}
	};
}

export function validateUserinfoHandlerConfig(config: Config) {
	const validate = ajv.compile(userinfoHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate userinfo handler configuration - ${errorText}`,
		);
	}
}

async function validateRequest(expressRequest: Request) {
	let authorizationHeaderCount = 0;
	for (let i = 0; i < expressRequest.rawHeaders.length; i += 2) {
		if (expressRequest.rawHeaders[i].toLowerCase() === "authorization") {
			authorizationHeaderCount++;
		}
	}
	if (authorizationHeaderCount > 1) {
		throw new OauthError(
			400,
			"invalid_request",
			"authorization header is invalid",
		);
	}
	if (expressRequest.headers.authorization?.includes(",")) {
		throw new OauthError(
			400,
			"invalid_request",
			"authorization header is invalid",
		);
	}
	let dpopHeaderCount = 0;
	for (let i = 0; i < expressRequest.rawHeaders.length; i += 2) {
		if (expressRequest.rawHeaders[i].toLowerCase() === "dpop") {
			dpopHeaderCount++;
		}
	}
	if (dpopHeaderCount > 1 || expressRequest.headers.dpop?.includes(",")) {
		throw new OauthError(400, "invalid_request", "dpop header is invalid");
	}

	const authorizationHeaderCapture = /^(dpop|bearer) (.+)$/i.exec(
		expressRequest.headers.authorization || "",
	);

	return {
		token_type: authorizationHeaderCapture?.[1],
		access_token: authorizationHeaderCapture?.[2],
		dpop: expressRequest.headers.dpop,
		method: expressRequest.method,
		uri: expressRequest.originalUrl,
	};
}
