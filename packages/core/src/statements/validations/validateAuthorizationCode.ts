import { jwtDecrypt } from "jose";
import { JWEDecryptionFailed } from "jose/errors";
import { OauthError } from "../../errors";
import type { AuthorizationCode } from "../../resources";

type validateAuthorizationCodeParams = {
	authorization_code: string;
	redirect_uri: string;
};

export type ValidateAuthorizationCodeConfig = {
	secret: string;
	previous_secrets: Array<string>;
};

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
		} = await jwtDecrypt<AuthorizationCode>(
			authorization_code,
			new TextEncoder().encode(config.secret),
		).catch((error) => {
			if (error instanceof JWEDecryptionFailed) {
				return jwtDecrypt<AuthorizationCode>(
					authorization_code,
					new TextEncoder().encode(config.previous_secrets[0]),
				);
			}

			throw error;
		});

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
