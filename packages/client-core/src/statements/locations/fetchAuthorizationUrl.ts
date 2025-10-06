import type { ClientStateStore } from "../../../dist";
import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";
import type { ClientState, IssuerMetadata, OauthClient } from "../../resources";
import { fetchIssuerMetadata } from "../resources";

export type FetchAuthorizationUrlParams = {
	client: OauthClient;
	issuer_state: string;
	client_state: ClientState;
};

export type FetchAuthorizationUrlConfig = {
	wallet_callback_url: string;
	httpClient: HttpClient;
	clientStateStore: ClientStateStore;
};

type PushedAuthorizationRequestParams = {
	redirect_uri?: string;
	client_id?: string;
	issuer_state?: string;
	scope?: string;
	state?: string;
	code_challenge_method?: string;
	code_challenge?: string;
	response_type?: string;
};

export async function fetchAuthorizationUrl(
	{ client_state, client, issuer_state }: FetchAuthorizationUrlParams,
	config: FetchAuthorizationUrlConfig,
) {
	const pushedAuthorizationRequestParams: PushedAuthorizationRequestParams = {};

	const { issuer_metadata } = await fetchIssuerMetadata(
		{
			client_state,
			issuer: client_state.issuer,
		},
		config,
	);

	if (!issuer_metadata?.pushed_authorization_request_endpoint) {
		throw new OauthError(
			"invalid_client",
			"pushed authorization request endpoint missing in issuer metadata ",
		);
	}
	const pushedAuthorizationRequestUrl = new URL(
		issuer_metadata.pushed_authorization_request_endpoint,
	);

	pushedAuthorizationRequestParams.redirect_uri = config.wallet_callback_url;

	if (!client) {
		throw new OauthError(
			"invalid_client",
			"pushed authorization requests require a client",
		);
	}
	pushedAuthorizationRequestParams.client_id = client.client_id;

	if (!issuer_state) {
		throw new OauthError(
			"invalid_request",
			"pushed authorization requests require an issuer state",
		);
	}
	pushedAuthorizationRequestParams.issuer_state = issuer_state;

	pushedAuthorizationRequestParams.state = client_state.state;

	pushedAuthorizationRequestParams.response_type = "code";

	pushedAuthorizationRequestParams.code_challenge_method = "S256";
	pushedAuthorizationRequestParams.code_challenge = await S256codeChallenge(
		client_state.code_verifier,
	);

	pushedAuthorizationRequestParams.scope = getScopeFromIssuerMetadata(
		client_state.credential_configuration_ids || [],
		issuer_metadata,
	);

	const {
		data: { request_uri },
	} = await config.httpClient
		.post<{ request_uri: string }>(
			pushedAuthorizationRequestUrl.toString(),
			pushedAuthorizationRequestParams,
			{
				headers: {},
			},
		)
		.catch((error) => {
			throw new OauthError(
				"invalid_issuer",
				"could not perform pushed authorization request",
				{ error },
			);
		});

	if (!issuer_metadata?.authorization_endpoint) {
		throw new OauthError(
			"invalid_client",
			"authorization endpoint missing in issuer metadata ",
		);
	}

	const authorizeUrl = new URL(issuer_metadata.authorization_endpoint);
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
