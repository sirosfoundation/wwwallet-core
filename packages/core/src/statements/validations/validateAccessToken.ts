import type { TokenValidator } from "../../config";
import { OauthError } from "../../errors";
import type { OauthClient } from "../../resources";

type validateAccessTokenParams = {
	access_token: string | undefined;
};

export type ValidateAccessTokenConfig = {
	clients: Array<OauthClient>;
	databaseOperations: {
		validateToken: TokenValidator;
	};
	issuer_client: OauthClient;
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
			payload: { client_id, sub, scope },
		} = await config.databaseOperations.validateToken(
			"access_token",
			access_token,
		);

		const client = config.clients
			.concat([config.issuer_client])
			.find(({ id }) => id === client_id);

		if (!client) {
			throw new OauthError(
				401,
				"invalid_request",
				"access token oauth client could not be found",
			);
		}

		return {
			access_token,
			client,
			sub,
			scope,
		};
	} catch (_error) {
		throw new OauthError(401, "invalid_request", "access token is invalid");
	}
}
