import { jwtDecrypt } from "jose";
import { OauthError } from "../../errors";

type validateAuthorizationCodeParams = {
	authorization_code: string | undefined;
};

export type ValidateAuthorizationCodeConfig = {
	secret: string;
};

// TODO validate code redirect uri according to request
export async function validateAuthorizationCode(
	{ authorization_code }: validateAuthorizationCodeParams,
	config: ValidateAuthorizationCodeConfig,
) {
	if (!authorization_code) {
		throw new OauthError(
			400,
			"invalid_request",
			"authorization_code must be defined",
		);
	}

	try {
		const {
			payload: { sub, scope },
		} = await jwtDecrypt<{ sub: string; scope: string }>(
			authorization_code,
			new TextEncoder().encode(config.secret),
		);

		return {
			authorization_code,
			sub,
			scope,
		};
	} catch (_error) {
		throw new OauthError(
			401,
			"invalid_client",
			"authorization code is invalid",
		);
	}
}
