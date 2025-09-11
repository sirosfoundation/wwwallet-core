import { OauthError } from "../../errors";
import type { OauthClient } from "../../resources";

export type FetchAuthorizationUrlParams = {
	issuer: string;
	client: OauthClient;
	issuer_state: string;
};

type RequestHeaders = {
	[key: string]: string;
};

export type FetchAuthorizationUrlConfig = {
	wallet_url: string;
	httpClient: {
		post: <T>(
			url: string,
			body?: unknown,
			config?: { headers: RequestHeaders },
		) => Promise<{ data: T }>;
	};
};

type PushedAuthorizationRequestParams = {
	redirect_uri?: string;
	client_id?: string;
	issuer_state?: string;
	scope?: string;
};

export async function fetchAuthorizationUrl(
	{ issuer, client, issuer_state }: FetchAuthorizationUrlParams,
	config: FetchAuthorizationUrlConfig,
) {
	const pushedAuthorizationRequestParams: PushedAuthorizationRequestParams = {};

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

	pushedAuthorizationRequestParams.redirect_uri = config.wallet_url;

	if (!client) {
		throw new OauthError(
			400,
			"invalid_client",
			"pushed authorization requests require a client",
		);
	}
	pushedAuthorizationRequestParams.client_id = client.client_id;

	if (!issuer_state) {
		throw new OauthError(
			400,
			"invalid_request",
			"pushed authorization requests require an issuer state",
		);
	}
	pushedAuthorizationRequestParams.issuer_state = issuer_state;

	// TODO get scope from session location
	pushedAuthorizationRequestParams.scope = client.scope;

	const {
		data: { request_uri },
	} = await config.httpClient
		.post<{ request_uri: string }>(
			pushedAuthorizationRequestUrl.toString(),
			pushedAuthorizationRequestParams,
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			},
		)
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
