import { OauthError } from "../../errors";
import type { OauthClient } from "../../resources";

export type IssuerClientParams = {
	issuer: string;
};

export type IssuerClientConfig = {
	static_clients: Array<OauthClient>;
};

/**
 * Selects the configured OAuth client for a specific issuer.
 *
 * ### Why (Security)
 * Using preconfigured clients avoids untrusted runtime client substitution.
 *
 * ### Specifications
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 2, client concepts
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 2.3, client authentication context
 * - OpenID4VCI, wallet to issuer client model
 */
export async function issuerClient(
	{ issuer }: IssuerClientParams,
	config: IssuerClientConfig,
) {
	const client = config.static_clients.find(
		(client) => client.issuer === issuer,
	);

	if (!client) {
		throw new OauthError("invalid_client", "could not find issuer client");
	}

	return { client };
}
