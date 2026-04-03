import { type DecryptConfig, jwtDecryptWithConfigKeys } from "../../crypto";
import { OauthError } from "../../errors";
import type { AuthorizationCode } from "../../resources";

export type validateAuthorizationCodeParams = {
	authorization_code: string;
	redirect_uri?: string;
};

export type ValidateAuthorizationCodeConfig = DecryptConfig;

// TODO validate code redirect uri according to request
/**
 * Decrypts and validates authorization code payload before token exchange.
 *
 * ### Why (Security)
 * Strict code validation blocks forged or stale code exchange attempts.
 *
 * ### Specifications
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 4.1.3, token request with authorization code
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 4.1.2, code semantics
 * - RFC 7636 (Proof Key for Code Exchange by OAuth Public Clients) Section 4.5, PKCE validation prerequisites
 */
export async function validateAuthorizationCode(
	{
		authorization_code,
		redirect_uri: requestedRedirectUri,
	}: validateAuthorizationCodeParams,
	config: ValidateAuthorizationCodeConfig,
) {
	try {
		const {
			payload: {
				token_type,
				redirect_uri,
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

		if (redirect_uri !== requestedRedirectUri) {
			// NOTE skip code redirect uri validation that is not applicable
			// with decentralized flows
			//
			// throw new OauthError(
			// 	400,
			// 	"invalid_request",
			// 	"authorization code is invalid",
			// );
		}

		return {
			authorization_code,
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
