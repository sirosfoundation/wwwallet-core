import { type DecryptConfig, jwtDecryptWithConfigKeys } from "../../crypto";
import { OauthError } from "../../errors";
import type { AccessToken, OauthClient } from "../../resources";

export type validateAccessTokenParams = {
	access_token: string | undefined;
};

export type ValidateAccessTokenConfig = {
	clients: Array<OauthClient>;
	issuer_client: OauthClient;
} & DecryptConfig;

// TODO validate code redirect uri according to request
/**
 * What:
 * - Decrypts access token, checks token type, and resolves issuing client.
 *
 * Why:
 * - Protected endpoints must reject malformed/foreign tokens before authorizing
 *   any resource access.
 *
 * Specification:
 * - OAuth 2.0 Bearer Token Usage (RFC 6750).
 * - OAuth 2.0 token processing rules (RFC 6749).
 */
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
		} = await jwtDecryptWithConfigKeys<AccessToken>(access_token, config);

		if (token_type !== "access_token") {
			throw new OauthError(401, "invalid_request", "access token is invalid");
		}

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
