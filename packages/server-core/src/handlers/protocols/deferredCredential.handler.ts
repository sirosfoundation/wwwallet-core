import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../../config";
import type { DecryptConfig } from "../../crypto";
import { OauthError, type OauthErrorResponse } from "../../errors";
import type {
	BearerCredentials,
	DeferredCredential,
	DeferredResourceOwnerData,
} from "../../resources";
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
	GenerateCredentialsConfig & {
		dataOperations: {
			fetchDeferredResourceOwnerData: (
				defered_credential: DeferredCredential,
				config: DecryptConfig,
			) => Promise<{
				defer_data: DeferredResourceOwnerData | null;
			}>;
		};
	};

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
					access_token: request.credentials.access_token,
				},
				config,
			);

			await validateDpop(
				{
					access_token,
					dpopRequest: request.credentials.dpopRequest,
					dpop: request.credentials.dpop,
				},
				config,
			);

			const { defer_data } =
				await config.dataOperations.fetchDeferredResourceOwnerData(
					{
						transaction_id: request.transaction_id,
					},
					config,
				);

			const { credentials } = await generateCredentials(
				{
					defer_data,
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
	if (!expressRequest.body) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential requests require a body",
		);
	}

	const { transaction_id } = expressRequest.body;

	if (!transaction_id) {
		throw new OauthError(
			400,
			"invalid_request",
			"transaction id is missing from body parameters",
		);
	}

	const credentials: DeferredCredentialRequest["credentials"] = {};

	const authorizationHeaderCapture = /(DPoP|[b|B]earer) (.+)/.exec(
		expressRequest.headers.authorization || "",
	);

	if (authorizationHeaderCapture) {
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
