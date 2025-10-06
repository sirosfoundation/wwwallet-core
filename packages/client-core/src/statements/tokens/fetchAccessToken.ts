import type { IssuerMetadata } from "../../../dist";
import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";
import type { ClientState, OauthClient } from "../../resources";

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
