import type { IssuerClient } from "../../resources";

export type IssuerClientConfig = {
	issuer_client: IssuerClient;
};

/**
 * Returns the issuer client configured by server policy.
 *
 * ### Why (Security)
 * Server-side client resolution prevents attacker-controlled client context.
 *
 * ### Specifications
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 2.3, client authentication context
 * - OpenID4VCI issuer operational model
 * - Trusted server client resolution patterns
 */
export async function issuerClient(
	config: IssuerClientConfig,
): Promise<{ client: IssuerClient }> {
	return { client: config.issuer_client };
}
