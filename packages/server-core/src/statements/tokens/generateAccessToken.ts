import { EncryptJWT } from "jose";
import type { OauthClient, OauthScope } from "../../resources";

export type GenerateAccessTokenParams = {
	authorization_code?: string;
	client: OauthClient;
	scope: OauthScope;
	sub?: string;
	grant_type: string;
};

export type GenerateAccessTokenConfig = {
	access_token_ttl: number;
	token_encryption: string;
	secret: string;
};

/**
 * Issues an encrypted access token with client, subject, and scope claims.
 *
 * ### Why (Security)
 * Short-lived protected tokens and typed claims reduce token confusion and misuse.
 *
 * ### Specifications
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 5.1, access token issuance
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 7.1, token type context
 * - OpenID4VCI, access token requirements for credential endpoint
 */
export async function generateAccessToken(
	{
		authorization_code,
		client,
		sub: requestedSub,
		scope,
		grant_type,
	}: GenerateAccessTokenParams,
	config: GenerateAccessTokenConfig,
) {
	const sub = requestedSub || client.id;
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const access_token = await new EncryptJWT({
		previous_code: authorization_code,
		grant_type,
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
