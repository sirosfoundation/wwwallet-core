import { OauthError } from "../../errors";
import type { IssuerMetadata } from "../../resources";
import {
	type FetchIssuerMetadataConfig,
	fetchIssuerMetadata,
	type ValidateCredentialOfferConfig,
	validateCredentialOffer,
} from "../../statements";

export type CredentialOfferLocationConfig = ValidateCredentialOfferConfig &
	FetchIssuerMetadataConfig;

type CredentialOfferProtocol = "oid4vci";

type CredentialOfferNextStep = "pushed_authorization_request";

export type CredentialOfferLocation = {
	credential_offer: string | null;
};

type PushedAuthorizationRequestMetadata = {
	credential_configuration_ids: Array<string>;
	issuer_state: string;
	issuer_metadata: IssuerMetadata;
};

export type CredentialOfferProtocolResponse = {
	protocol: CredentialOfferProtocol;
	nextStep?: CredentialOfferNextStep;
	data?: PushedAuthorizationRequestMetadata;
};

const protocol = "oid4vci";
const nextStep = "pushed_authorization_request";

export async function handleCredentialOffer(
	location: CredentialOfferLocation,
	config: CredentialOfferLocationConfig,
): Promise<CredentialOfferProtocolResponse> {
	if (!location.credential_offer) {
		throw new OauthError(
			400,
			"invalid_location",
			"credential offer parameter is missing",
		);
	}

	const { credential_issuer, credential_configuration_ids, grants } =
		await validateCredentialOffer(
			{
				credential_offer: location.credential_offer,
			},
			config,
		);

	const { issuer_metadata } = await fetchIssuerMetadata(
		{
			grants,
			credential_issuer,
		},
		config,
	);

	if (grants?.authorization_code) {
		const { issuer_state } = grants.authorization_code;

		return {
			protocol,
			nextStep,
			data: {
				issuer_state,
				issuer_metadata,
				credential_configuration_ids,
			},
		};
	}

	throw new OauthError(
		400,
		"invalid_location",
		"credential offer grants is not supported",
	);
}
