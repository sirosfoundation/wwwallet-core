import { EncryptJWT } from "jose";
import type { OauthClient } from "../../resources";

export type GenerateIssuerGrantsParams = {
	client: OauthClient;
};

export type GenerateIssuerGrantsConfig = {
	secret: string;
	token_encryption: string;
	issuer_state_ttl: number;
};

/**
 * Generates issuer grants including issuer_state for the authorization code initiation.
 *
 * ### Why (Security)
 * Protected issuer_state reduces forgery and grant-context tampering.
 *
 * ### Specifications
 * - OpenID4VCI, grants.authorization_code.issuer_state
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 4.1, authorization code grant
 * - JWT or JWE protected state token profile
 */
export async function generateIssuerGrants(
	{ client }: GenerateIssuerGrantsParams,
	config: GenerateIssuerGrantsConfig,
) {
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const issuer_state = await new EncryptJWT({ sub: client.id })
		.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + config.issuer_state_ttl)
		.encrypt(secret);

	const grants = {
		authorization_code: {
			issuer_state,
		},
	};

	return { grants };
}
