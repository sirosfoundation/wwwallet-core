import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import {
	generateAuthorizationRequestUri,
	validateClientCredentials,
	validateIssuerState,
	validateScope,
} from "../statements";
import { pushedAuthorizationRequestHandlerConfigSchema } from "./schemas/pushedAuthorizationRequestHandlerConfig.schema";

const ajv = new Ajv();

export type PushedAuthorizationRequestHandlerConfig = {
	logger: Logger;
	issuer_client: {
		id: string;
	};
	clients: Array<{
		id: string;
		redirect_uris: Array<string>;
		scopes: Array<string>;
	}>;
	pushed_authorization_request_ttl: number;
	token_encryption: string;
	secret: string;
	previous_secrets: Array<string>;
};

type PushedAuthorizationRequest = {
	response_type: string;
	client_id: string;
	redirect_uri: string;
	scope?: string;
	state?: string;
	code_challenge?: string;
	code_challenge_method?: string;
	issuer_state: string;
};

type PushedAuthorizationRequestResponse = {
	status: 200;
	body: {
		request_uri: string;
		expires_in: number;
	};
};

export function pushedAuthorizationRequestHandlerFactory(
	config: PushedAuthorizationRequestHandlerConfig,
) {
	return async function pushedAuthorizationRequestHandler(
		expressRequest: Request,
	): Promise<PushedAuthorizationRequestResponse | OauthErrorResponse> {
		try {
			const request = await validateRequest(expressRequest);

			const { client } = await validateClientCredentials(
				{
					client_id: request.client_id,
					redirect_uri: request.redirect_uri,
					confidential: false,
				},
				config,
			);

			const { scope: _scope } = await validateScope(
				request.scope,
				{ client },
				config,
			);

			const { issuer_state: _issuer_state } = await validateIssuerState(
				{
					issuer_state: request.issuer_state,
				},
				config,
			);

			const { request_uri, expires_in } = await generateAuthorizationRequestUri(
				request,
				config,
			);

			config.logger.business("pushed_authorization", { request_uri });

			return {
				status: 200,
				body: { request_uri, expires_in },
			};
		} catch (error) {
			if (error instanceof OauthError) {
				config.logger.business("pushed_authorization_error", {
					error: error.message,
				});
				return error.toResponse();
			}

			throw error;
		}
	};
}

export function validatePushedAuthorizationRequestHandlerConfig(
	config: Config,
) {
	const validate = ajv.compile(pushedAuthorizationRequestHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate pushed authorization request handler configuration - ${errorText}`,
		);
	}
}

async function validateRequest(
	expressRequest: Request,
): Promise<PushedAuthorizationRequest> {
	if (!expressRequest.body) {
		throw new OauthError(
			400,
			"invalid_request",
			"pushed authorization requests require a body",
		);
	}
	const {
		response_type,
		client_id,
		redirect_uri,
		scope,
		state,
		code_challenge,
		code_challenge_method,
		issuer_state,
	} = expressRequest.body;

	if (response_type !== "code") {
		throw new OauthError(400, "invalid_request", "response_type is invalid");
	}

	if (!client_id) {
		throw new OauthError(
			400,
			"invalid_request",
			"client id is missing from body params",
		);
	}

	if (!redirect_uri) {
		throw new OauthError(
			400,
			"invalid_request",
			"redirect_uri is missing from body params",
		);
	}

	return {
		response_type,
		client_id,
		redirect_uri,
		scope,
		state,
		code_challenge,
		code_challenge_method,
		issuer_state,
	};
}
