import { OauthError } from "../../errors";
import type { ClientStateStore } from "../../ports";
import type {
	ClientState,
	OauthAuthorizationServer,
	OpenidCredentialIssuer,
} from "../../resources";

export type FetchIssuerMetadataParams = {
	issuer: string;
	client_state: ClientState;
};

export type FetchIssuerMetadataConfig = {
	httpClient: {
		get: <T>(url: string) => Promise<{ data: T }>;
	};
	clientStateStore: ClientStateStore;
};

export async function fetchIssuerMetadata(
	{ client_state, issuer }: FetchIssuerMetadataParams,
	config: FetchIssuerMetadataConfig,
) {
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

		const issuer_metadata = {
			...oauthAuthorizationServer,
			...openidCredentialIssuer,
		};

		const newClientState = await config.clientStateStore.setIssuerMetadata(
			client_state,
			issuer_metadata,
		);

		return {
			issuer_metadata,
			client_state: newClientState,
		};
	} catch (_error) {
		throw new OauthError(
			400,
			"invalid_issuer",
			"could not fetch issuer information",
		);
	}
}
