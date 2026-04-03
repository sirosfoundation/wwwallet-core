import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";
import type { IssuerMetadata } from "../../resources";

export type FetchNonceParams = {
	issuer_metadata: IssuerMetadata;
	dpop: string;
};

export type FetchNonceConfig = {
	httpClient: HttpClient;
};

/**
 * Fetches a c_nonce value for proof freshness before credential issuance.
 *
 * ### Why (Security)
 * Nonce usage mitigates replay of holder proofs.
 *
 * ### Specifications
 * - OpenID4VCI, nonce endpoint and c_nonce
 * - OpenID4VCI, proof freshness requirements
 * - RFC 9449 (OAuth 2.0 Demonstrating Proof-of-Possession at the Application Layer (DPoP)), request binding for DPoP-protected calls
 */
export async function fetchNonce(
	{ issuer_metadata, dpop }: FetchNonceParams,
	config: FetchNonceConfig,
) {
	try {
		const { c_nonce, c_nonce_expires_in } = await config.httpClient
			.post<{ c_nonce: string; c_nonce_expires_in: number }>(
				issuer_metadata.nonce_endpoint,
				{},
				{
					headers: {
						DPoP: dpop,
					},
				},
			)
			.then(({ data }) => data);

		return { c_nonce, c_nonce_expires_in };
	} catch (error) {
		throw new OauthError("invalid_request", "could not fetch nonce", {
			error,
		});
	}
}
