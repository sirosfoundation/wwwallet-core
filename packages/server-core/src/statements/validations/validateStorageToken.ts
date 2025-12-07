import { jwtVerify } from "jose";
import { OauthError } from "../../errors";

export type ValidateStorageTokenParams = {
	access_token: string | undefined;
};

export type ValidateStorageTokenConfig = {
	secret_base: string;
};

export async function validateStorageToken(
	{ access_token }: ValidateStorageTokenParams,
	config: ValidateStorageTokenConfig,
) {
	if (!access_token) {
		throw new OauthError(401, "invalid_request", "access token must be set");
	}

	// authorize client to access the data associated to keyid
	const secret = new TextEncoder().encode(config.secret_base);
	try {
		const { payload } = await jwtVerify(access_token, secret);

		return {
			storage_token: {
				access_token,
				payload: payload as { keyid: string },
			},
		};
	} catch (_error) {
		throw new OauthError(401, "invalid_request", "access token is invalid");
	}
}
