import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import type { AuthorizationRequest, ResourceOwner } from "../resources";
import {
	authorizationCodeRedirection,
	generateAuthorizationCode,
	validateClientCredentials,
	validateIssuerState,
	validateRequestUri,
	validateResourceOwner,
	validateScope,
} from "../statements";
import { authorizeHandlerConfigSchema } from "./schemas/authorizeHandlerConfig.schema";

const ajv = new Ajv();

export type AuthorizeHandlerConfig = {
	logger: Logger;
	issuer_client: {
		id: string;
	};
	clients: Array<{ id: string; scopes: Array<string> }>;
	authorization_code_ttl: number;
	token_encryption: string;
	secret: string;
	previous_secrets: Array<string>;
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
					authorization_request,
					confidential: false,
				},
				config,
			);

			const { scope } = await validateScope(
				authorization_request.scope,
				{ client },
				config,
			);

			const { issuer_state: _issuer_state } = await validateIssuerState(
				{
					issuer_state: authorization_request.issuer_state,
				},
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
					{
						authorization_request: authorization_request,
						resource_owner,
						scope,
					},
					config,
				);

				const { location } = await authorizationCodeRedirection(
					{ authorization_request, authorization_code },
					config,
				);

				config.logger.business("authenticate", {
					request_uri,
					authorization_code,
					sub: resource_owner.sub || "",
				});

				return {
					status: 302,
					location,
				};
			}

			config.logger.business("authorize", { request_uri });

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
				const data = authorizeErrorData(expressRequest);

				config.logger.business("authorize_error", {
					error: error.message,
					...data,
				});
				return error.toResponse(data);
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
			"client id is missing from request parameters",
		);
	}

	if (!request_uri) {
		throw new OauthError(
			400,
			"invalid_request",
			"request uri is missing from request parameters",
		);
	}

	return {
		client_id: client_id.toString(),
		request_uri: request_uri.toString(),
	};
}

function authorizeErrorData(expressRequest: Request) {
	const { client_id, request_uri } = expressRequest.query;

	return {
		clientId: client_id as string,
		requestUri: request_uri as string,
	};
}
