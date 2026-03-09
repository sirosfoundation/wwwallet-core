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
 * What:
 * - Builds the grant object returned in credential offers and issues a signed
 *   `issuer_state` token for the authorization step.
 *
 * Why:
 * - `issuer_state` binds wallet authorization to issuer context and lets the
 *   issuer reject replayed or foreign authorization requests.
 *
 * Specification:
 * - OID4VCI: `issuer_state` in authorization_code grant.
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
