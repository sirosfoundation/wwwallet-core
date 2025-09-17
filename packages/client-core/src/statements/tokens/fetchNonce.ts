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
		const { nonce } = await config.httpClient
			.post<{ nonce: string }>(
				issuer_metadata.nonce_endpoint,
				{},
				{
					headers: {
						DPoP: dpop,
					},
				},
			)
			.then(({ data }) => data);

		return { nonce };
	} catch (_error) {
		throw new OauthError(400, "invalid_request", "could not fetch nonce");
	}
}
