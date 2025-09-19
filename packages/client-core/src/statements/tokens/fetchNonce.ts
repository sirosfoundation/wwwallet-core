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
