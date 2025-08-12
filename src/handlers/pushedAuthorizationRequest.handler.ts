import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import {
	generateAuthorizationRequestUri,
	validateClientCredentials,
	validateScope,
} from "../statements";
import { pushedAuthorizationRequestHandlerConfigSchema } from "./schemas/pushedAuthorizationRequestHandlerConfig.schema";

const ajv = new Ajv();

export type PushedAuthorizationRequestConfig = {
	pushed_authorization_request_ttl: number;
	access_token_encryption: string;
	secret: string;
	clients: Array<{
		id: string;
		redirect_uris: Array<string>;
		scopes: Array<string>;
	}>;
};

type PushedAuthorizationRequest = {
	response_type: string;
	client_id: string;
	redirect_uri: string;
	scope?: string;
	state?: string;
	code_challenge?: string;
	code_challenge_method?: string;
};

type PushedAuthorizationRequestResponse = {
	status: 200;
	body: {
		request_uri: string;
		expires_in: number;
	};
};

export function pushedAuthorizationRequestHandlerFactory(
	config: PushedAuthorizationRequestConfig,
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

			const { request_uri, expires_in } = await generateAuthorizationRequestUri(
				request,
				config,
			);

			return {
				status: 200,
				body: { request_uri, expires_in },
			};
		} catch (error) {
			if (error instanceof OauthError) {
				return error.toResponse();
			}

			throw error;
		}
	};
}

export function validatePushedAuthorizationRequestConfig(config: Config) {
	const validate = ajv.compile(pushedAuthorizationRequestHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate token handler configuration - ${errorText}`,
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
			"pushed authorization requests requires a body",
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
	} = expressRequest.body;

	if (response_type !== "code") {
		throw new OauthError(400, "invalid_request", "response_type is invalid");
	}

	if (!client_id) {
		throw new OauthError(
			400,
			"invalid_request",
			"client_id is missing from body params",
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
	};
}
