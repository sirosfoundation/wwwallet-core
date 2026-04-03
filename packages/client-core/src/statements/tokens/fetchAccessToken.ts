import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";
import type { ClientState, IssuerMetadata, OauthClient } from "../../resources";

export type FetchAccessTokenParams = {
	client: OauthClient;
	client_state: ClientState;
	issuer_metadata: IssuerMetadata;
	code: string;
	dpop: string;
};

export type FetchAccessTokenConfig = {
	httpClient: HttpClient;
	wallet_callback_url: string;
};

type TokenResponse = {
	access_token: string;
	expires_in: number;
	token_type: string;
	refresh_token: string;
};

/**
 * Exchanges an authorization code for access token data at the token endpoint.
 *
 * ### Why (Security)
 * PKCE and DPoP binding reduce stolen code redemption and token replay.
 *
 * ### Specifications
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 4.1.3, access token request
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 5.1, access token response
 * - RFC 7636 (Proof Key for Code Exchange by OAuth Public Clients) Section 4.5, PKCE token request checks
 * - RFC 9449 (OAuth 2.0 Demonstrating Proof-of-Possession at the Application Layer (DPoP)) Section 7, DPoP at token endpoint
 */
export async function fetchAccessToken(
	{ client, client_state, issuer_metadata, code, dpop }: FetchAccessTokenParams,
	config: FetchAccessTokenConfig,
) {
	try {
		if (!issuer_metadata?.token_endpoint) {
			throw new OauthError(
				"invalid_issuer",
				"token endpoint is missing from issuer metadata",
			);
		}

		const { token_type, access_token, expires_in, refresh_token } =
			await config.httpClient
				.post<TokenResponse>(
					issuer_metadata.token_endpoint,
					{
						grant_type: "authorization_code",
						code,
						client_id: client.client_id,
						client_secret: client.client_secret,
						redirect_uri: config.wallet_callback_url,
						code_verifier: client_state.code_verifier,
					},
					{
						headers: {
							DPoP: dpop,
						},
					},
				)
				.then(({ data }) => data);

		return {
			token_type,
			access_token,
			expires_in,
			refresh_token,
		};
	} catch (error) {
		throw new OauthError("invalid_request", "could not fetch access token", {
			error,
		});
	}
}
