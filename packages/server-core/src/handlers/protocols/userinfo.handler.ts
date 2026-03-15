import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import {
	type ValidateAccessTokenConfig,
	validateAccessToken,
} from "../../statements";
import { userinfoHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type UserinfoHandlerConfig = {
	logger: Logger;
} & ValidateAccessTokenConfig;

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
			const { sub, scope } = await validateAccessToken(
				{
					token_type: request.token_type,
					access_token: request.access_token,
				},
				config,
			);

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
	const authorizationHeaderCapture = /^(DPoP|[Bb]earer) (.+)$/.exec(
		expressRequest.headers.authorization || "",
	);

	return {
		token_type: authorizationHeaderCapture?.[1],
		access_token: authorizationHeaderCapture?.[2],
	};
}
