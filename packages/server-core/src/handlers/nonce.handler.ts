import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import type { OauthClient } from "../resources";
import { generateCNonce, issuerClient } from "../statements";
import { nonceHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type NonceHandlerConfig = {
	logger: Logger;
	issuer_client: OauthClient;
	access_token_ttl: number;
	token_encryption: string;
	secret: string;
};

export type NonceResponse = {
	status: 200;
	body: {
		c_nonce: string;
	};
};

export function nonceHandlerFactory(config: NonceHandlerConfig) {
	return async function nonceHandler(
		_expressRequest: Request,
	): Promise<NonceResponse | OauthErrorResponse> {
		try {
			const { client: issuer_client } = await issuerClient(config);

			const { c_nonce } = await generateCNonce({ issuer_client }, config);

			config.logger.business("nonce", { c_nonce });

			return {
				status: 200,
				body: {
					c_nonce,
				},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				config.logger.business("nonce_error", { error: error.message });
				return error.toResponse();
			}

			throw error;
		}
	};
}

export function validateNonceHandlerConfig(config: Config) {
	const validate = ajv.compile(nonceHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}
