import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import { credentialHandlerConfigSchema } from "./schemas/credentialHandlerConfig.schema";

const ajv = new Ajv();

export type CredentialHandlerConfig = {};

type CredentialRequest = {};

type CredentialResponse = {
	status: 200;
	data: {};
	body: {};
};

export function credentialHandlerFactory(_config: CredentialHandlerConfig) {
	return async function credentialHandler(
		expressRequest: Request,
	): Promise<CredentialResponse | OauthErrorResponse> {
		try {
			const _request = await validateRequest(expressRequest);

			throw new OauthError(
				400,
				"invalid_request",
				"credential endpoint not implemented",
			);

			// return {
			// 	status: 200,
			// 	data: {},
			// 	body: {},
			// };
		} catch (error) {
			if (error instanceof OauthError) {
				return error.toResponse();
			}

			throw error;
		}
	};
}

export function validateCredentialHandlerConfig(config: Config) {
	const validate = ajv.compile(credentialHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}

async function validateRequest(
	_expressRequest: Request,
): Promise<CredentialRequest> {
	return {};
}
