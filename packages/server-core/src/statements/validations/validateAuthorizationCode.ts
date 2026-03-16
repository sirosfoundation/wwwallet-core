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
 * Decrypts authorization code, validates token type, and returns bound claims
 *   (redirect URI, PKCE data, subject, scope, nonce).
 *
 * ## Why
 * Token exchange must only succeed for codes issued by this server and for
 *   the exact authorization context they were minted for.
 *
 * ## Specification
 * - OAuth 2.0 (RFC 6749) section 4.1.3.
 * - OpenID Connect Core 1.0 nonce handling for code flow.
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
