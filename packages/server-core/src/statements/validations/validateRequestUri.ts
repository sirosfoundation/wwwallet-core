import { AUTHORIZATION_REQUEST_URI_PREFIX } from "../../constants";
import { type DecryptConfig, jwtDecryptWithConfigKeys } from "../../crypto";
import { OauthError } from "../../errors";
import type { AuthorizationRequest } from "../../resources";

export type validateRequestUriParams = {
	request_uri: string | undefined;
};

export type ValidateRequestUriConfig = DecryptConfig;

/**
 * Validates request URI format/prefix, decrypts request object, and returns
 *   normalized authorization request parameters.
 *
 * ## Why
 * Authorization endpoint decisions must rely on authenticated PAR content
 *   rather than mutable front-channel query parameters. OpenID front-channel
 *   requests also rely on nonce propagation from this validated request object.
 *
 * Hardening references:
 * - `580b472` require nonce for OpenID front-channel flows.
 *
 * ## Specification
 * - OAuth 2.0 Pushed Authorization Requests (RFC 9126).
 */
export async function validateRequestUri(
	{ request_uri }: validateRequestUriParams,
	config: ValidateRequestUriConfig,
) {
	if (!request_uri) {
		throw new OauthError(400, "invalid_request", "request_uri must be defined");
	}

	if (!request_uri.startsWith(AUTHORIZATION_REQUEST_URI_PREFIX)) {
		throw new OauthError(400, "invalid_request", "malformed request uri");
	}

	try {
		const {
			payload: {
				token_type,
				iat,
				response_type,
				client_id,
				redirect_uri,
				scope,
				state,
				nonce,
				code_challenge,
				code_challenge_method,
				issuer_state,
			},
		} = await jwtDecryptWithConfigKeys<AuthorizationRequest>(
			request_uri.replace(AUTHORIZATION_REQUEST_URI_PREFIX, ""),
			config,
		);

		if (token_type !== "authorization_request") {
			throw new OauthError(
				401,
				"invalid_client",
				"authorization request is invalid",
			);
		}
		const now = Math.floor(Date.now() / 1000);
		const issuedAt = Number(iat);
		if (!Number.isInteger(issuedAt) || issuedAt <= 0 || issuedAt > now) {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization request is invalid",
			);
		}
		if (
			typeof response_type !== "string" ||
			response_type.length === 0 ||
			typeof client_id !== "string" ||
			client_id.length === 0 ||
			typeof redirect_uri !== "string" ||
			redirect_uri.length === 0
		) {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization request is invalid",
			);
		}
		if (scope !== undefined && typeof scope !== "string") {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization request is invalid",
			);
		}
		if (state !== undefined && typeof state !== "string") {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization request is invalid",
			);
		}
		if (nonce !== undefined && typeof nonce !== "string") {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization request is invalid",
			);
		}
		if (code_challenge !== undefined && typeof code_challenge !== "string") {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization request is invalid",
			);
		}
		if (
			code_challenge_method !== undefined &&
			typeof code_challenge_method !== "string"
		) {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization request is invalid",
			);
		}
		if (issuer_state !== undefined && typeof issuer_state !== "string") {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization request is invalid",
			);
		}

		return {
			request_uri,
			authorization_request: {
				response_type,
				client_id,
				redirect_uri,
				scope,
				state,
				nonce,
				code_challenge,
				code_challenge_method,
				issuer_state,
			},
		};
	} catch (_error) {
		throw new OauthError(
			400,
			"invalid_request",
			"authorization request is invalid",
		);
	}
}
