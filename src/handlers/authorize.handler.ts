import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import type { AuthorizationRequest, ResourceOwner } from "../resources";
import {
	authorizationCodeRedirection,
	generateAuthorizationCode,
	validateClientCredentials,
	validateRequestUri,
	validateResourceOwner,
	validateScope,
} from "../statements";
import { authorizeHandlerConfigSchema } from "./schemas/authorizeHandlerConfig.schema";

const ajv = new Ajv();

export type AuthorizeHandlerConfig = {
	clients: Array<{ id: string; scopes: Array<string> }>;
	authorization_code_ttl: number;
	token_encryption: string;
	secret: string;
};

type AuthorizeRequest = {
	client_id: string;
	request_uri: string;
};

type AuthorizeResponse =
	| {
			status: 200;
			data: {
				requestUri: string;
				clientId: string;
				authorizationRequest: AuthorizationRequest;
			};
	  }
	| {
			status: 302;
			location: string;
	  };

export function authorizeHandlerFactory(config: AuthorizeHandlerConfig) {
	return async function authorizeHandler(
		expressRequest: Request,
		resourceOwner: ResourceOwner | null = null,
	): Promise<AuthorizeResponse | OauthErrorResponse> {
		try {
			const request = await validateRequest(expressRequest);

			const { request_uri, authorization_request } = await validateRequestUri(
				{
					request_uri: request.request_uri,
				},
				config,
			);

			const { client } = await validateClientCredentials(
				{
					client_id: request.client_id,
					request_uri,
					confidential: false,
				},
				config,
			);

			const { scope } = await validateScope(
				authorization_request.scope,
				{ client },
				config,
			);

			if (resourceOwner) {
				const { resource_owner } = await validateResourceOwner(
					{
						resource_owner: resourceOwner,
					},
					config,
				);

				const { authorization_code } = await generateAuthorizationCode(
					{ resource_owner, scope },
					config,
				);

				const { location } = await authorizationCodeRedirection(
					{ authorization_request, authorization_code },
					config,
				);
				return {
					status: 302,
					location,
				};
			}

			return {
				status: 200,
				data: {
					requestUri: request.request_uri,
					clientId: client.id,
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
			`Could not validate authorize handler configuration - ${errorText}`,
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
			"client credentials requests requires request parameters",
		);
	}

	const { client_id, request_uri } = expressRequest.query;

	if (!client_id) {
		throw new OauthError(
			400,
			"invalid_request",
			"client_id is missing from request parameters",
		);
	}

	if (!request_uri) {
		throw new OauthError(
			400,
			"invalid_request",
			"request_uri is missing from request parameters",
		);
	}

	return {
		client_id: client_id.toString(),
		request_uri: request_uri.toString(),
	};
}
