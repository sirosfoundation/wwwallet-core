import { type DecryptConfig, jwtDecryptWithConfigKeys } from "../../crypto";
import { OauthError } from "../../errors";
import type { AuthorizationCode, OauthClient } from "../../resources";

export type validateAuthorizationCodeParams = {
	authorization_code: string;
	redirect_uri: string;
	client: OauthClient;
};

export type ValidateAuthorizationCodeConfig = DecryptConfig;

/**
 * Decrypts authorization code, validates token type, and returns bound claims
 *   (issued-at time, redirect URI, PKCE data, subject, scope, nonce).
 *
 * ## Why
 * Token exchange must only succeed for codes issued by this server and for
 *   the exact authorization context they were minted for, including
 *   `redirect_uri` and authenticated `client_id` binding.
 *
 * ## Specification
 * - OAuth 2.0 (RFC 6749) section 4.1.3.
 * - OpenID Connect Core 1.0 nonce handling for code flow.
 */
export async function validateAuthorizationCode(
	{
		authorization_code,
		redirect_uri: requestedRedirectUri,
		client: requestedClient,
	}: validateAuthorizationCodeParams,
	config: ValidateAuthorizationCodeConfig,
) {
	try {
		const {
			payload: {
				token_type,
				iat,
				client_id,
				redirect_uri,
				nonce,
				code_challenge,
				code_challenge_method,
				sub,
				scope,
			},
		} = await jwtDecryptWithConfigKeys<AuthorizationCode>(
			authorization_code,
			config,
		);

		if (token_type !== "authorization_code") {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization code is invalid",
			);
		}
		if (typeof client_id !== "string" || client_id.trim().length === 0) {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization code is invalid",
			);
		}
		if (typeof sub !== "string" || sub.trim().length === 0) {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization code is invalid",
			);
		}
		const now = Math.floor(Date.now() / 1000);
		const issuedAt = Number(iat);
		if (!Number.isInteger(issuedAt) || issuedAt <= 0 || issuedAt > now) {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization code is invalid",
			);
		}

		if (redirect_uri !== requestedRedirectUri) {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization code is invalid",
			);
		}
		if (client_id !== requestedClient.id) {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization code is invalid",
			);
		}
		if (scope !== undefined && typeof scope !== "string") {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization code is invalid",
			);
		}
		if (nonce !== undefined && typeof nonce !== "string") {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization code is invalid",
			);
		}
		if (code_challenge !== undefined && typeof code_challenge !== "string") {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization code is invalid",
			);
		}
		if (
			code_challenge_method !== undefined &&
			typeof code_challenge_method !== "string"
		) {
			throw new OauthError(
				400,
				"invalid_request",
				"authorization code is invalid",
			);
		}

		return {
			authorization_code,
			client_id,
			nonce,
			code_challenge,
			code_challenge_method,
			sub,
			scope,
		};
	} catch (_error) {
		throw new OauthError(
			400,
			"invalid_request",
			"authorization code is invalid",
		);
	}
}
