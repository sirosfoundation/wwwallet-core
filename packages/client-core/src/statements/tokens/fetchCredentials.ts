import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";
import type {
	DeferredCredential,
	IssuerMetadata,
	Proofs,
} from "../../resources";

export type FetchCredentialsParams =
	| {
			issuer_metadata: IssuerMetadata;
			access_token: string;
			dpop: string;
			credential_configuration_id: string;
			proofs: Proofs | undefined;
	  }
	| {
			issuer_metadata: IssuerMetadata;
			access_token: string;
			dpop: string;
			deferred_credential: DeferredCredential;
	  };

export type FetchCredentialsConfig = {
	httpClient: HttpClient;
};

export async function fetchCredentials(
	params: FetchCredentialsParams,
	config: FetchCredentialsConfig,
) {
	if ("deferred_credential" in params) {
		return await fetchDeferredCredentials(params, config);
	}

	return await doFetchCredentials(params, config);
}

async function fetchDeferredCredentials(
	{
		issuer_metadata,
		access_token,
		dpop,
		deferred_credential,
	}: {
		issuer_metadata: IssuerMetadata;
		access_token: string;
		dpop: string;
		deferred_credential: DeferredCredential;
	},
	config: FetchCredentialsConfig,
) {
	if (!access_token) {
		throw new OauthError("invalid_parameters", "access token is missing");
	}

	if (!issuer_metadata.deferred_credential_endpoint) {
		throw new OauthError(
			"invalid_parameters",
			"deferred credential endpoint is missing in issuer metadata",
		);
	}

	try {
		const { credentials, transaction_id, interval } = await config.httpClient
			.post<{
				credentials?: Array<{ credential: string }>;
				transaction_id?: string;
				interval?: number;
			}>(
				issuer_metadata.credential_endpoint,
				{
					transaction_id: deferred_credential.transaction_id,
				},
				{
					headers: {
						// TODO use access token response token type
						Authorization: `DPoP ${access_token}`,
						DPoP: dpop,
					},
				},
			)
			.then(({ data }) => ({
				credentials: data.credentials?.map(({ credential }) => ({
					credential,
				})),
				transaction_id: data.transaction_id,
				interval: data.interval,
			}));

		return { credentials, transaction_id, interval };
	} catch (error) {
		throw new OauthError(
			"invalid_request",
			"could not fetch deferred credential",
			{
				error,
			},
		);
	}
}

async function doFetchCredentials(
	{
		issuer_metadata,
		access_token,
		dpop,
		credential_configuration_id,
		proofs,
	}: {
		issuer_metadata: IssuerMetadata;
		access_token: string;
		dpop: string;
		credential_configuration_id: string;
		proofs: Proofs | undefined;
	},
	config: FetchCredentialsConfig,
) {
	if (!access_token) {
		throw new OauthError("invalid_parameters", "access token is missing");
	}

	if (!credential_configuration_id) {
		throw new OauthError(
			"invalid_parameters",
			"credential configuration id is missing",
		);
	}

	if (!issuer_metadata.credential_endpoint) {
		throw new OauthError(
			"invalid_parameters",
			"credential endpoint is missing in issuer metadata",
		);
	}

	if (!issuer_metadata.credential_configurations_supported) {
		throw new OauthError(
			"invalid_parameters",
			"credential configurations supported is missing in issuer metadata",
		);
	}

	const format =
		issuer_metadata.credential_configurations_supported[
			credential_configuration_id
		]?.format;

	if (!format) {
		throw new OauthError(
			"invalid_parameters",
			"credential configuration id is not present in credential configurations supported",
		);
	}

	try {
		const { credentials, transaction_id, interval } = await config.httpClient
			.post<{
				credentials?: Array<{ credential: string }>;
				transaction_id?: string;
				interval?: number;
			}>(
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
					},
				},
			)
			.then(({ data }) => ({
				credentials: data.credentials?.map(({ credential }) => ({
					credential,
					format,
				})),
				transaction_id: data.transaction_id,
				interval: data.interval,
			}));

		return { credentials, transaction_id, interval };
	} catch (error) {
		throw new OauthError("invalid_request", "could not fetch credential", {
			error,
		});
	}
}
