import { OauthError } from "../../errors";
import type { ClientState, IssuerMetadata } from "../../resources";
import {
	type FetchAccessTokenConfig,
	type FetchIssuerMetadataConfig,
	type FetchNonceConfig,
	fetchAccessToken,
	fetchIssuerMetadata,
	fetchNonce,
	type GenerateDpopConfig,
	generateDpop,
	type IssuerClientConfig,
	issuerClient,
	type ValidateCredentialOfferConfig,
	type ValidateGrantsConfig,
	validateCredentialOffer,
	validateGrants,
} from "../../statements";

export type CredentialOfferLocationConfig = ValidateCredentialOfferConfig &
	ValidateGrantsConfig &
	FetchAccessTokenConfig &
	FetchNonceConfig &
	FetchIssuerMetadataConfig &
	GenerateDpopConfig &
	IssuerClientConfig;

type CredentialOfferProtocol = "oid4vci";

export type CredentialOfferLocation = {
	credential_offer: string | null;
};

export type CredentialOfferResponse =
	| {
			protocol: CredentialOfferProtocol;
			nextStep: "authorization_request";
			data: {
				issuer: string;
				credential_configuration_ids: Array<string>;
				issuer_state: string | undefined;
			};
	  }
	| {
			protocol: CredentialOfferProtocol;
			nextStep: "credential_request";
			data: {
				issuer_metadata: IssuerMetadata;
				client_state: ClientState;
				token_type: string;
				access_token: string;
				expires_in: number;
				state: string;
				c_nonce: string;
				c_nonce_expires_in: number;
				refresh_token: string;
			};
	  };

const protocol = "oid4vci";

export async function handleCredentialOffer(
	location: CredentialOfferLocation,
	config: CredentialOfferLocationConfig,
): Promise<CredentialOfferResponse> {
	try {
		return await doHandleCredentialOffer(location, config);
	} catch (error) {
		if (error instanceof OauthError) {
			throw error.toResponse({ protocol });
		}

		throw error;
	}
}

async function doHandleCredentialOffer(
	location: CredentialOfferLocation,
	config: CredentialOfferLocationConfig,
): Promise<CredentialOfferResponse> {
	if (!location.credential_offer) {
		throw new OauthError(
			"invalid_location",
			"credential offer parameter is missing",
		);
	}

	const {
		credential_issuer: issuer,
		credential_configuration_ids,
		grants,
	} = await validateCredentialOffer(
		{
			credential_offer: location.credential_offer,
		},
		config,
	);

	const { grant_types, issuer_state, preauthorized_code, client_state } =
		await validateGrants(
			{ credential_configuration_ids, issuer, grants },
			config,
		);

	if (client_state) {
		await config.clientStateStore.commitChanges(client_state);
	}

	if (grant_types.includes("pre-authorized_code")) {
		const nextStep = "credential_request";

		const { client } = await issuerClient(
			{
				issuer: client_state.issuer,
			},
			config,
		);

		const { issuer_metadata } = await fetchIssuerMetadata(
			{
				client_state,
				issuer: client_state.issuer,
			},
			config,
		);

		const { dpop: accessTokenDpop } = await generateDpop(
			{
				client_state,
				htu: issuer_metadata.token_endpoint,
				htm: "POST",
			},
			config,
		);

		const { token_type, access_token, expires_in, refresh_token } =
			await fetchAccessToken(
				{
					client,
					client_state,
					issuer_metadata,
					dpop: accessTokenDpop,
					preauthorized_code,
				},
				config,
			);

		const { dpop: nonceDpop } = await generateDpop(
			{
				client_state,
				access_token,
				htm: issuer_metadata.nonce_endpoint,
				htu: "POST",
			},
			config,
		);

		const { c_nonce, c_nonce_expires_in } = await fetchNonce(
			{
				dpop: nonceDpop,
				issuer_metadata,
			},
			config,
		);

		return {
			protocol,
			nextStep,
			data: {
				issuer_metadata,
				client_state,
				token_type,
				access_token,
				expires_in,
				state: client_state.state,
				c_nonce,
				c_nonce_expires_in,
				refresh_token,
			},
		};
	}

	if (grant_types.includes("authorization_code")) {
		const nextStep = "authorization_request";

		return {
			protocol,
			nextStep,
			data: {
				issuer,
				issuer_state,
				credential_configuration_ids,
			},
		};
	}

	throw new OauthError(
		"invalid_location",
		"credential offer grants is not supported",
	);
}
