import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";
import type { IssuerMetadata, Proofs } from "../../resources";

export type FetchCredentialsParams = {
	issuer_metadata: IssuerMetadata;
	access_token: string;
	dpop: string;
	credential_configuration_id: string;
	proofs: Proofs | undefined;
};

export type FetchCredentialsConfig = {
	httpClient: HttpClient;
};

export async function fetchCredentials(
	{
		issuer_metadata,
		access_token,
		dpop,
		credential_configuration_id,
		proofs,
	}: FetchCredentialsParams,
	config: FetchCredentialsConfig,
) {
	if (!access_token) {
		throw new OauthError(400, "invalid_parameters", "access token is missing");
	}

	if (!credential_configuration_id) {
		throw new OauthError(
			400,
			"invalid_parameters",
			"credential configuration id is missing",
		);
	}

	if (!issuer_metadata.credential_endpoint) {
		throw new OauthError(
			400,
			"invalid_parameters",
			"credential endpoint is missing in issuer metadata",
		);
	}

	try {
		const { credentials } = await config.httpClient
			.post<{ credentials: Array<string> }>(
				issuer_metadata.credential_endpoint,
				{
					credential_configuration_id,
					proofs,
				},
				{
					headers: {
						// TODO use access token response token type
						Authorization: `DPoP ${access_token}`,
						DPoP: dpop,
						"Content-Type": "application/json",
					},
				},
			)
			.then(({ data }) => data);

		return { credentials };
	} catch (error) {
		throw new OauthError(400, "invalid_request", "could not fetch credential", {
			error,
		});
	}
}
