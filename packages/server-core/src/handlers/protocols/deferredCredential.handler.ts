import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import type { BearerCredentials } from "../../resources";
import {
	type GenerateCredentialsConfig,
	generateCredentials,
	type ValidateAccessTokenConfig,
	type ValidateDpopConfig,
	validateAccessToken,
	validateDpop,
} from "../../statements";
import { deferredCredentialHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type DeferredCredentialHandlerConfig = ValidateAccessTokenConfig &
	ValidateDpopConfig &
	GenerateCredentialsConfig;

type DeferredCredentialRequest = {
	credentials: BearerCredentials;
	transaction_id: string;
};

type DefferedCredentialResponse = {
	status: 200;
	data: {};
	body: {
		credentials?: Array<{ credential: string }>;
		transaction_id?: string;
	};
};

export function deferredCredentialHandlerFactory(
	config: DeferredCredentialHandlerConfig,
) {
	return async function deferredCredentialHandler(
		expressRequest: Request,
	): Promise<DefferedCredentialResponse | OauthErrorResponse> {
		try {
			const request = await validateRequest(expressRequest);

			const { access_token } = await validateAccessToken(
				{
					token_type: request.credentials.token_type,
					access_token: request.credentials.access_token,
				},
				config,
			);

			await validateDpop(
				{
					token_type: request.credentials.token_type,
					access_token,
					dpopRequest: request.credentials.dpopRequest,
					dpop: request.credentials.dpop,
				},
				config,
			);

			const { credentials } = await generateCredentials(
				{
					transaction_id: request.transaction_id,
				},
				config,
			);

			return {
				status: 200,
				data: {},
				body: {
					credentials,
				},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				const data = templateErrorData(expressRequest);
				return error.toResponse(data);
			}

			throw error;
		}
	};
}

export function validateDeferredCredentialHandlerConfig(config: Config) {
	const validate = ajv.compile(deferredCredentialHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}

async function validateRequest(
	expressRequest: Request,
): Promise<DeferredCredentialRequest> {
	if (
		!expressRequest.body ||
		typeof expressRequest.body !== "object" ||
		Array.isArray(expressRequest.body)
	) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential requests require a body",
		);
	}

	const { transaction_id } = expressRequest.body;

	if (
		typeof transaction_id !== "string" ||
		transaction_id.trim().length === 0
	) {
		throw new OauthError(
			400,
			"invalid_request",
			"transaction id is missing from body parameters",
		);
	}

	const credentials: DeferredCredentialRequest["credentials"] = {};

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

	const authorizationHeaderCapture = /(\S+) (.+)/.exec(
		expressRequest.headers.authorization || "",
	);

	if (authorizationHeaderCapture) {
		credentials.token_type = authorizationHeaderCapture[1];
		credentials.access_token = authorizationHeaderCapture[2];
	}

	credentials.dpop = expressRequest.headers.dpop;

	credentials.dpopRequest = {
		method: expressRequest.method,
		uri: expressRequest.originalUrl,
	};

	return {
		credentials,
		transaction_id,
	};
}

function templateErrorData(_expressRequest: Request) {
	return {};
}
