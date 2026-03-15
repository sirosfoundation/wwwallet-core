import { OauthError } from "../../errors";

export type ValidateCodeChallengeParams = {
	response_type: string;
	code_challenge?: string;
	code_challenge_method?: string;
};

export type ValidateCodeChallengeConfig = unknown;

/**
 * Validates PKCE challenge input for authorization flows that return an
 * authorization code.
 *
 * ## Why
 * Code-based OAuth/OIDC flows should require PKCE challenge material early to
 * prevent weakened authorization code exchanges later at the token endpoint.
 *
 * ## Specification
 * - OAuth 2.0 Authorization Code flow (RFC 6749).
 * - PKCE (RFC 7636), `S256` challenge method.
 */
export async function validateCodeChallenge(
	{
		response_type,
		code_challenge,
		code_challenge_method,
	}: ValidateCodeChallengeParams,
	_config?: ValidateCodeChallengeConfig,
) {
	const requiresPkce =
		response_type === "code" || response_type === "code token";
	if (!requiresPkce) {
		return { code_challenge, code_challenge_method };
	}

	if (!code_challenge) {
		throw new OauthError(
			400,
			"invalid_request",
			"code_challenge is missing from body params",
		);
	}

	if (code_challenge_method !== "S256") {
		throw new OauthError(
			400,
			"invalid_request",
			"code_challenge_method must be S256",
		);
	}

	return { code_challenge, code_challenge_method };
}
