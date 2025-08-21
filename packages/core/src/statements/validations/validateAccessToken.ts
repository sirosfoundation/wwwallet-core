import { jwtDecrypt } from "jose";
import { OauthError } from "../../errors";
import type { AccessToken } from "../../resources";

type validateAccessTokenParams = {
	access_token: string | undefined;
};

export type ValidateAccessTokenConfig = {
	secret: string;
};

// TODO validate code redirect uri according to request
export async function validateAccessToken(
	{ access_token }: validateAccessTokenParams,
	config: ValidateAccessTokenConfig,
) {
	if (!access_token) {
		throw new OauthError(401, "invalid_request", "access token must be set");
	}

	try {
		const {
			payload: { token_type, client_id, sub, scope },
		} = await jwtDecrypt<AccessToken>(
			access_token,
			new TextEncoder().encode(config.secret),
		);

		if (token_type !== "access_token") {
			throw new OauthError(401, "invalid_request", "access token is invalid");
		}

		return {
			access_token,
			client_id,
			sub,
			scope,
		};
	} catch (_error) {
		throw new OauthError(401, "invalid_request", "access token is invalid");
	}
}
