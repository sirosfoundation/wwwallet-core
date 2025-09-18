import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";
import type { IssuerMetadata, OauthClient } from "../../resources";

export type FetchAccessTokenParams = {
	client: OauthClient;
	issuer_metadata: IssuerMetadata;
	code: string;
	dpop: string;
};

export type FetchAccessTokenConfig = {
	httpClient: HttpClient;
};

type TokenResponse = {
	access_token: string;
	expires_in: number;
	c_nonce: string;
	c_nonce_expires_in: number;
	refresh_token: string;
};

export async function fetchAccessToken(
	{ client, issuer_metadata, code, dpop }: FetchAccessTokenParams,
	config: FetchAccessTokenConfig,
) {
	try {
		const {
			access_token,
			expires_in,
			c_nonce,
			c_nonce_expires_in,
			refresh_token,
		} = await config.httpClient
			.post<TokenResponse>(
				issuer_metadata.token_endpoint,
				{
					grant_type: "authorization_code",
					code,
					client_id: client.client_id,
					client_secret: client.client_secret,
				},
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						DPoP: dpop,
					},
				},
			)
			.then(({ data }) => data);

		return {
			access_token,
			expires_in,
			c_nonce,
			c_nonce_expires_in,
			refresh_token,
		};
	} catch (error) {
		throw new OauthError("invalid_request", "could not fetch access token", {
			error,
		});
	}
}
