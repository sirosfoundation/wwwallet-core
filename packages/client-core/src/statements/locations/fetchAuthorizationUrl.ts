import { OauthError } from "../../errors";
import type { ClientState, IssuerMetadata, OauthClient } from "../../resources";

export type FetchAuthorizationUrlParams = {
	client: OauthClient;
	issuer_state: string;
	client_state: ClientState;
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
	state?: string;
	code_challenge_method?: string;
	code_challenge?: string;
};

export async function fetchAuthorizationUrl(
	{ client_state, client, issuer_state }: FetchAuthorizationUrlParams,
	config: FetchAuthorizationUrlConfig,
) {
	const pushedAuthorizationRequestParams: PushedAuthorizationRequestParams = {};

	if (!client_state.issuer_metadata?.pushed_authorization_request_endpoint) {
		throw new OauthError(
			400,
			"invalid_client",
			"pushed authorization request endpoint missing in issuer metadata ",
		);
	}
	const pushedAuthorizationRequestUrl = new URL(
		client_state.issuer_metadata.pushed_authorization_request_endpoint,
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

	pushedAuthorizationRequestParams.state = client_state.state;

	pushedAuthorizationRequestParams.code_challenge_method = "S256";
	pushedAuthorizationRequestParams.code_challenge = await S256codeChallenge(
		client_state.code_verifier,
	);

	pushedAuthorizationRequestParams.scope = getScopeFromIssuerMetadata(
		client_state.credential_configuration_ids || [],
		client_state.issuer_metadata,
	);

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

	if (!client_state.issuer_metadata?.authorization_endpoint) {
		throw new OauthError(
			400,
			"invalid_client",
			"authorization endpoint missing in issuer metadata ",
		);
	}

	const authorizeUrl = new URL(
		client_state.issuer_metadata.authorization_endpoint,
	);
	const authorizeParams = new URLSearchParams();
	authorizeParams.append("client_id", client.client_id);
	authorizeParams.append("request_uri", request_uri);
	authorizeUrl.search = `?${authorizeParams.toString()}`;

	return { authorize_url: authorizeUrl.toString() };
}

function getScopeFromIssuerMetadata(
	credential_configuration_ids: Array<string>,
	issuer_metadata: IssuerMetadata,
) {
	return Object.keys(issuer_metadata.credential_configurations_supported)
		.filter((credential_configuration_id) => {
			return credential_configuration_ids.includes(credential_configuration_id);
		})
		.map((credential_configuration_id) => {
			return issuer_metadata.credential_configurations_supported[
				credential_configuration_id
			].scope;
		})
		.join(" ");
}

async function S256codeChallenge(code_verifier: string) {
	const rawCodeVerifier = new TextEncoder().encode(code_verifier);
	const hash = await crypto.subtle.digest("SHA-256", rawCodeVerifier);

	return btoa(String.fromCharCode(...new Uint8Array(hash)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}
