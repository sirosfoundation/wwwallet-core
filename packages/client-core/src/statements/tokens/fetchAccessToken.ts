import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";
import type { ClientState, IssuerMetadata, OauthClient } from "../../resources";

export type FetchAccessTokenParams = {
	client: OauthClient;
	client_state: ClientState;
	issuer_metadata: IssuerMetadata;
	code?: string;
	preauthorized_code?: string;
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
	{
		client,
		client_state,
		issuer_metadata,
		code,
		preauthorized_code,
		dpop,
	}: FetchAccessTokenParams,
	config: FetchAccessTokenConfig,
) {
	try {
		if (!issuer_metadata?.token_endpoint) {
			throw new OauthError(
				"invalid_issuer",
				"token endpoint is missing from issuer metadata",
			);
		}

		const tokenRequestBody: {
			grant_type?: string;
			client_id: string;
			client_secret: string;
			redirect_uri: string;
			code_verifier: string;
			code?: string;
			"pre-authorized_code"?: string;
		} = {
			client_id: client.client_id,
			client_secret: client.client_secret,
			redirect_uri: config.wallet_callback_url,
			code_verifier: client_state.code_verifier,
		};

		if (code) {
			tokenRequestBody.grant_type = "authorization_code";
			tokenRequestBody.code = code;
		}

		if (preauthorized_code) {
			tokenRequestBody.grant_type =
				"urn:ietf:params:oauth:grant-type:pre-authorized_code";
			tokenRequestBody["pre-authorized_code"] = preauthorized_code;
		}

		if (!tokenRequestBody.grant_type) {
			throw new OauthError("invalid_request", "grant type not supported", {
				request: tokenRequestBody,
			});
		}

		const { token_type, access_token, expires_in, refresh_token } =
			await config.httpClient
				.post<TokenResponse>(issuer_metadata.token_endpoint, tokenRequestBody, {
					headers: {
						DPoP: dpop,
					},
				})
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
