import { OauthError } from "../../errors";
import type { ClientStateStore, HttpClient } from "../../ports";
import type {
	ClientState,
	OauthAuthorizationServer,
	OpenidCredentialIssuer,
} from "../../resources";

export type FetchIssuerMetadataParams = {
	issuer?: string;
	client_state: ClientState;
};

export type FetchIssuerMetadataConfig = {
	httpClient: HttpClient;
	clientStateStore: ClientStateStore;
};

export async function fetchIssuerMetadata(
	{ client_state, issuer }: FetchIssuerMetadataParams,
	config: FetchIssuerMetadataConfig,
) {
	if (client_state.issuer_metadata) {
		return {
			issuer_metadata: client_state.issuer_metadata,
			client_state,
		};
	}

	try {
		const openidCredentialIssuerUrl = new URL(
			"/.well-known/openid-credential-issuer",
			issuer,
		);
		const oauthAuthorizationServerUrl = new URL(
			"/.well-known/oauth-authorization-server",
			issuer,
		);
		const [openidCredentialIssuer, oauthAuthorizationServer] =
			await Promise.all([
				config.httpClient
					.get<OpenidCredentialIssuer>(openidCredentialIssuerUrl.toString())
					.then(({ data }) => data),
				config.httpClient
					.get<OauthAuthorizationServer>(oauthAuthorizationServerUrl.toString())
					.then(({ data }) => data),
			]);

		// TODO verify issuer metadata json schema
		const issuer_metadata = {
			...oauthAuthorizationServer,
			...openidCredentialIssuer,
		};

		return {
			issuer_metadata,
			client_state,
		};
	} catch (error) {
		throw new OauthError(
			"invalid_issuer",
			"could not fetch issuer information",
			{ error },
		);
	}
}
