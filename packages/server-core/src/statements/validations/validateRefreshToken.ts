import { type DecryptConfig, jwtDecryptWithConfigKeys } from "../../crypto";
import { OauthError } from "../../errors";
import type { RefreshToken } from "../../resources";

export type ValidateRefreshTokenParams = {
	refresh_token: string;
};

export type ValidateRefreshTokenConfig = DecryptConfig;

/**
 * Decrypts refresh token, validates token type, and returns bound
 *   client/subject/scope claims for token rotation.
 *
 * ## Why
 * Refresh exchange must only proceed for server-issued refresh tokens tied to
 *   the requesting client and constrained scope.
 *
 * ## Specification
 * - OAuth 2.0 (RFC 6749) section 6.
 */
export async function validateRefreshToken(
	{ refresh_token }: ValidateRefreshTokenParams,
	config: ValidateRefreshTokenConfig,
) {
	try {
		const {
			payload: { token_type, client_id, sub, scope },
		} = await jwtDecryptWithConfigKeys<RefreshToken>(refresh_token, config);

		if (token_type !== "refresh_token") {
			throw new OauthError(400, "invalid_request", "refresh token is invalid");
		}

		return {
			refresh_token,
			client_id,
			sub,
			scope,
		};
	} catch (_error) {
		throw new OauthError(400, "invalid_request", "refresh token is invalid");
	}
}
