import { OauthError } from "../../errors";
import type {
	Grants,
	OauthAuthorizationServer,
	OpenidCredentialIssuer,
} from "../../resources";

export type FetchIssuerMetadataParams = {
	grants: Grants;
	credential_issuer: string;
};

export type FetchIssuerMetadataConfig = {
	httpClient: {
		get: <T>(url: string) => Promise<{ data: T }>;
	};
};

export async function fetchIssuerMetadata(
	{ grants: _grants, credential_issuer }: FetchIssuerMetadataParams,
	config: FetchIssuerMetadataConfig,
) {
	try {
		const openidCredentialIssuerUrl = new URL(
			"/.well-known/openid-credential-issuer",
			credential_issuer,
		);
		const openidCredentialIssuer = await config.httpClient
			.get<OpenidCredentialIssuer>(openidCredentialIssuerUrl.toString())
			.then(({ data }) => data);

		const oauthAuthorizationServerUrl = new URL(
			"/.well-known/oauth-authorization-server",
			credential_issuer,
		);
		const oauthAuthorizationServer = await config.httpClient
			.get<OauthAuthorizationServer>(oauthAuthorizationServerUrl.toString())
			.then(({ data }) => data);

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
