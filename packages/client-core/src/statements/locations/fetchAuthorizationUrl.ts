import { OauthError } from "../../errors";
import type { OauthClient } from "../../resources";

export type FetchAuthorizationUrlParams = {
	issuer: string;
	client: OauthClient;
	issuer_state: string;
};

export type FetchAuthorizationUrlConfig = {
	wallet_url: string;
	httpClient: {
		get: <T>(url: string) => Promise<{ data: T }>;
	};
};

export async function fetchAuthorizationUrl(
	{ issuer, client, issuer_state }: FetchAuthorizationUrlParams,
	config: FetchAuthorizationUrlConfig,
) {
	const pushedAuthorizationRequestParams = new URLSearchParams();

	if (!issuer) {
		throw new OauthError(
			400,
			"invalid_client",
			"pushed authorization requests require an issuer",
		);
	}
	// TODO get pushed authorization request endpoint from session issuer information
	const pushedAuthorizationRequestUrl = new URL(
		client.pushed_authorization_request_endpoint,
	);

	pushedAuthorizationRequestParams.append("redirect_uri", config.wallet_url);

	if (!client) {
		throw new OauthError(
			400,
			"invalid_client",
			"pushed authorization requests require a client",
		);
	}
	pushedAuthorizationRequestParams.append("client_id", client.client_id);

	if (!issuer_state) {
		throw new OauthError(
			400,
			"invalid_request",
			"pushed authorization requests require an issuer state",
		);
	}
	pushedAuthorizationRequestParams.append("issuer_state", issuer_state);

	// TODO get scope from session location
	pushedAuthorizationRequestParams.append("scope", client.scope);

	pushedAuthorizationRequestUrl.search = `?${pushedAuthorizationRequestParams.toString()}`;

	const {
		data: { request_uri },
	} = await config.httpClient
		.get<{ request_uri: string }>(pushedAuthorizationRequestUrl.toString())
		.catch((error) => {
			throw new OauthError(
				400,
				"invalid_issuer",
				"could not perform pushed authorization request",
				{ request: error },
			);
		});

	// TODO get authorize endpoint from session issuer information
	const authorizeUrl = new URL(client.authorize_endpoint);
	const authorizeParams = new URLSearchParams();
	authorizeParams.append("client_id", client.client_id);
	authorizeParams.append("request_uri", request_uri);
	authorizeUrl.search = `?${authorizeParams.toString()}`;

	return { authorize_url: authorizeUrl.toString() };
}
