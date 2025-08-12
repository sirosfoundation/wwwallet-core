import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import type { AuthorizationRequest } from "../resources";
import { validateClientCredentials, validateRequestUri } from "../statements";
import { authorizeHandlerConfigSchema } from "./schemas/authorizeHandlerConfig.schema";

const ajv = new Ajv();

export type AuthorizeHandlerConfig = {
	clients: Array<{ id: string; scopes: Array<string> }>;
	secret: string;
};

type AuthorizeRequest = {
	client_id: string;
	request_uri: string;
};

type AuthorizeResponse = {
	status: 200;
	data: {
		requestUri: string;
		authorizationRequest: AuthorizationRequest;
	};
};

export function authorizeHandlerFactory(config: AuthorizeHandlerConfig) {
	return async function authorizeHandler(
		expressRequest: Request,
	): Promise<AuthorizeResponse | OauthErrorResponse> {
		try {
			const request = await validateRequest(expressRequest);

			const { request_uri, authorization_request } = await validateRequestUri(
				{
					request_uri: request.request_uri,
				},
				config,
			);

			const { client: _client } = await validateClientCredentials(
				{
					client_id: request.client_id,
					request_uri,
					confidential: false,
				},
				config,
			);

			return {
				status: 200,
				data: {
					requestUri: request.request_uri,
					authorizationRequest: authorization_request,
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

export function validateAuthorizeHandlerConfig(config: Config) {
	const validate = ajv.compile(authorizeHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate token handler configuration - ${errorText}`,
		);
	}
}

async function validateRequest(
	expressRequest: Request,
): Promise<AuthorizeRequest> {
	if (!expressRequest.query) {
		throw new OauthError(
			400,
			"invalid_request",
			"client credentials requests requires query params",
		);
	}

	const { client_id, request_uri } = expressRequest.query;

	if (!client_id) {
		throw new OauthError(
			400,
			"invalid_request",
			"client_id is missing from query params",
		);
	}

	if (!request_uri) {
		throw new OauthError(
			400,
			"invalid_request",
			"request_uri is missing from query params",
		);
	}

	return {
		client_id: client_id.toString(),
		request_uri: request_uri.toString(),
	};
}
