import type { IssuerClient } from "../../resources";

export type IssuerClientConfig = {
	issuer_client: IssuerClient;
};

/**
 * Returns the configured issuer client context for downstream issuer statements.
 *
 * ## Why
 * Keeps issuer identity/scopes sourced from a single canonical place, so all
 *   grant and offer generation uses consistent issuer context.
 *
 * ## Specification
 * - OpenID for Verifiable Credential Issuance (OID4VCI), issuer metadata and grant context.
 */
export async function issuerClient(
	config: IssuerClientConfig,
): Promise<{ client: IssuerClient }> {
	return { client: config.issuer_client };
}
