import { type DecryptConfig, jwtDecryptWithConfigKeys } from "../../crypto";
import { OauthError } from "../../errors";
import type { AuthorizationCode } from "../../resources";

type validateAuthorizationCodeParams = {
	authorization_code: string;
	redirect_uri: string;
};

export type ValidateAuthorizationCodeConfig = DecryptConfig;

// TODO validate code redirect uri according to request
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
			throw new OauthError(
				400,
				"invalid_request",
				"authorization code is invalid",
			);
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
