import { EncryptJWT } from "jose";
import type { OauthClient, OauthScope } from "../../resources";

export type GenerateAccessTokenParams = {
	authorization_code?: string;
	client: OauthClient;
	scope: OauthScope;
	sub?: string;
};

export type GenerateAccessTokenConfig = {
	access_token_ttl: number;
	token_encryption: string;
	secret: string;
};

/**
 * Creates an encrypted access token carrying client, subject, scope, and
 *   optional linkage to a previous authorization artifact.
 *
 * ## Why
 * Resource endpoints need a compact bearer artifact that represents delegated
 *   authorization state without repeated database lookups.
 *
 * ## Specification
 * - OAuth 2.0 (RFC 6749) token response semantics.
 * - OAuth 2.0 Bearer Token Usage (RFC 6750).
 */
export async function generateAccessToken(
	{
		authorization_code,
		client,
		sub: requestedSub,
		scope,
	}: GenerateAccessTokenParams,
	config: GenerateAccessTokenConfig,
) {
	const sub = requestedSub || client.id;
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const access_token = await new EncryptJWT({
		previous_code: authorization_code,
		token_type: "access_token",
		client_id: client.id,
		sub,
		scope,
	})
		.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + config.access_token_ttl)
		.encrypt(secret);

	const expires_in = config.access_token_ttl;

	return { access_token, expires_in };
}
