import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import {
	type GenerateAuthorizationRequestUriConfig,
	generateAuthorizationRequestUri,
	type ValidateClientCredentialsConfig,
	type ValidateIssuerStateConfig,
	type ValidateResponseTypesConfig,
	validateClientCredentials,
	validateCodeChallenge,
	validateIssuerState,
	validateResponseTypes,
	validateScope,
} from "../../statements";
import { pushedAuthorizationRequestHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type PushedAuthorizationRequestHandlerConfig = {
	logger: Logger;
} & ValidateClientCredentialsConfig &
	ValidateIssuerStateConfig &
	ValidateResponseTypesConfig &
	GenerateAuthorizationRequestUriConfig;

type PushedAuthorizationRequest = {
	response_type: string;
	client_id?: string;
	redirect_uri: string;
	oauth_client_attestation?: string;
	scope?: string;
	state?: string;
	nonce?: string;
	code_challenge?: string;
	code_challenge_method?: string;
	issuer_state: string;
};

export type PushedAuthorizationRequestResponse = {
	status: 201;
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
					oauth_client_attestation: request.oauth_client_attestation,
					confidential: false,
				},
				config,
			);

			const { scope: _scope } = await validateScope(
				{
					scope: request.scope,
					client,
				},
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
				status: 201,
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
	if (
		!expressRequest.body ||
		typeof expressRequest.body !== "object" ||
		Array.isArray(expressRequest.body)
	) {
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
		nonce,
		code_challenge,
		code_challenge_method,
		issuer_state,
	} = expressRequest.body;

	const { response_type: validated_response_type } =
		await validateResponseTypes({
			response_type,
		});

	if (typeof redirect_uri !== "string" || redirect_uri.trim().length === 0) {
		throw new OauthError(
			400,
			"invalid_request",
			"redirect_uri is missing from body params",
		);
	}
	if (client_id !== undefined && typeof client_id !== "string") {
		throw new OauthError(400, "invalid_request", "client_id is invalid");
	}
	if (scope !== undefined && typeof scope !== "string") {
		throw new OauthError(400, "invalid_request", "scope is invalid");
	}
	if (state !== undefined && typeof state !== "string") {
		throw new OauthError(400, "invalid_request", "state is invalid");
	}
	if (nonce !== undefined && typeof nonce !== "string") {
		throw new OauthError(400, "invalid_request", "nonce is invalid");
	}
	if (issuer_state !== undefined && typeof issuer_state !== "string") {
		throw new OauthError(400, "invalid_request", "issuer_state is invalid");
	}
	await validateCodeChallenge({
		response_type: validated_response_type,
		code_challenge,
		code_challenge_method,
	});

	let oauth_client_attestation: string | undefined;
	if (Array.isArray(expressRequest.headers["oauth-client-attestation"])) {
		if (expressRequest.headers["oauth-client-attestation"].length > 1) {
			throw new OauthError(
				400,
				"invalid_request",
				"oauth-client-attestation header is invalid",
			);
		}
		oauth_client_attestation =
			expressRequest.headers["oauth-client-attestation"][0];
	} else {
		oauth_client_attestation =
			expressRequest.headers["oauth-client-attestation"];
	}
	if (oauth_client_attestation?.includes(",")) {
		throw new OauthError(
			400,
			"invalid_request",
			"oauth-client-attestation header is invalid",
		);
	}

	return {
		response_type: validated_response_type,
		client_id,
		redirect_uri,
		oauth_client_attestation,
		scope,
		state,
		nonce,
		code_challenge,
		code_challenge_method,
		issuer_state,
	};
}
