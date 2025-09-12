import { OauthError } from "../../errors";
import type {
	OauthAuthorizationServer,
	OpenidCredentialIssuer,
} from "../../resources";

export type FetchIssuerMetadataParams = {
	issuer: string;
	issuer_state: string;
};

export type FetchIssuerMetadataConfig = {
	httpClient: {
		get: <T>(url: string) => Promise<{ data: T }>;
	};
};

export async function fetchIssuerMetadata(
	{ issuer, issuer_state: _issuer_state }: FetchIssuerMetadataParams,
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

		return {
			issuer_metadata: {
				...oauthAuthorizationServer,
				...openidCredentialIssuer,
			},
		};
	} catch (_error) {
		throw new OauthError(
			400,
			"invalid_issuer",
			"could not fetch issuer information",
		);
	}
}
