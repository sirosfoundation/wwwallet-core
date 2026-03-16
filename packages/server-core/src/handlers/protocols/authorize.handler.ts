import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import type { AuthorizationRequest, ResourceOwner } from "../../resources";
import {
	type AuthorizationCodeRedirectionConfig,
	type GenerateAccessTokenConfig,
	type GenerateAuthorizationCodeConfig,
	type GenerateIdTokenConfig,
	type HybridGrantRedirectionConfig,
	type ImplicitGrantRedirectionConfig,
	type ValidateClientCredentialsConfig,
	type ValidateIssuerStateConfig,
	type ValidateRequestUriConfig,
	type ValidateResourceOwnerConfig,
	type ValidateResponseTypesConfig,
	type ValidateScopeConfig,
	validateClientCredentials,
	validateIssuerState,
	validateRequestUri,
	validateResourceOwner,
	validateResponseTypes,
	validateScope,
} from "../../statements";
import { handleAuthorizationCodeResponse } from "./authorize/authorizationCode";
import { handleHybridGrantResponse } from "./authorize/hybridGrant";
import { handleImplicitGrantResponse } from "./authorize/implicitGrant";
import { authorizeHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type AuthorizeHandlerConfig = {
	logger: Logger;
} & ValidateRequestUriConfig &
	ValidateClientCredentialsConfig &
	ValidateScopeConfig &
	ValidateIssuerStateConfig &
	ValidateResponseTypesConfig &
	ValidateResourceOwnerConfig &
	GenerateAccessTokenConfig &
	GenerateAuthorizationCodeConfig &
	GenerateIdTokenConfig &
	AuthorizationCodeRedirectionConfig &
	HybridGrantRedirectionConfig &
	ImplicitGrantRedirectionConfig;

type AuthorizeRequest = {
	client_id: string;
	request_uri: string;
};

export type AuthorizeResponse =
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

			const { response_type } = await validateResponseTypes(
				{
					response_type: authorization_request.response_type,
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
				{
					scope: authorization_request.scope,
					client,
				},
				config,
			);

			const { issuer_state: _issuer_state } = await validateIssuerState(
				{
					issuer_state: authorization_request.issuer_state,
				},
				config,
			);

			config.logger.business("authorize", { request_uri });

			if (!resourceOwner) {
				return {
					status: 200,
					data: {
						requestUri: request.request_uri,
						clientId: client.id,
						authorizationRequest: authorization_request,
					},
				};
			}

			const { resource_owner } = await validateResourceOwner(
				{
					resource_owner: resourceOwner,
				},
				config,
			);

			if (response_type === "code") {
				return await handleAuthorizationCodeResponse(
					{
						request_uri,
						authorization_request,
						resource_owner,
						scope,
					},
					config,
				);
			}

			if (response_type === "token") {
				return await handleImplicitGrantResponse(
					{
						request_uri,
						authorization_request,
						client,
						resource_owner,
						scope,
					},
					config,
				);
			}

			if (response_type === "code token") {
				return await handleHybridGrantResponse(
					{
						request_uri,
						authorization_request,
						client,
						resource_owner,
						scope,
					},
					config,
				);
			}

			throw new OauthError(
				400,
				"invalid_request",
				"response type is not supported",
			);
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

	if (typeof client_id !== "string" || client_id.trim().length === 0) {
		throw new OauthError(
			400,
			"invalid_request",
			"client id is missing from request parameters",
		);
	}

	if (typeof request_uri !== "string" || request_uri.trim().length === 0) {
		throw new OauthError(
			400,
			"invalid_request",
			"request uri is missing from request parameters",
		);
	}

	return {
		client_id,
		request_uri,
	};
}

function authorizeErrorData(expressRequest: Request) {
	const { client_id, request_uri } = expressRequest.query;

	return {
		clientId: client_id as string,
		requestUri: request_uri as string,
	};
}
