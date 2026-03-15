import { type DecryptConfig, jwtDecryptWithConfigKeys } from "../../crypto";
import { OauthError } from "../../errors";
import type { AccessToken, OauthClient } from "../../resources";

export type validateAccessTokenParams = {
	token_type?: string;
	access_token: string | undefined;
};

export type ValidateAccessTokenConfig = {
	clients: Array<OauthClient>;
	issuer_client: OauthClient;
} & DecryptConfig;

// TODO validate code redirect uri according to request
/**
 * Decrypts access token, validates authorization token type (`DPoP`/`Bearer`)
 * when provided, checks JWT token type claim, and resolves issuing client.
 *
 * ## Why
 * Protected endpoints must reject malformed/foreign tokens before authorizing
 *   any resource access.
 *
 * ## Specification
 * - OAuth 2.0 Bearer Token Usage (RFC 6750).
 * - OAuth 2.0 token processing rules (RFC 6749).
 * - OAuth 2.0 Demonstrating Proof-of-Possession (DPoP), RFC 9449.
 */
export async function validateAccessToken(
	{ token_type, access_token }: validateAccessTokenParams,
	config: ValidateAccessTokenConfig,
) {
	if (token_type && !token_type.match(/^(DPoP|[Bb]earer)$/)) {
		throw new OauthError(
			401,
			"invalid_request",
			"access token type is invalid",
		);
	}

	if (!access_token) {
		throw new OauthError(401, "invalid_request", "access token must be set");
	}

	try {
		const {
			payload: { token_type, iat, client_id, sub, scope },
		} = await jwtDecryptWithConfigKeys<AccessToken>(access_token, config);

		if (token_type !== "access_token") {
			throw new OauthError(401, "invalid_request", "access token is invalid");
		}
		const now = Math.floor(Date.now() / 1000);
		const issuedAt = Number(iat);
		if (
			typeof client_id !== "string" ||
			client_id.trim().length === 0 ||
			typeof sub !== "string" ||
			sub.trim().length === 0 ||
			typeof scope !== "string" ||
			!Number.isInteger(issuedAt) ||
			issuedAt <= 0 ||
			issuedAt > now
		) {
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
