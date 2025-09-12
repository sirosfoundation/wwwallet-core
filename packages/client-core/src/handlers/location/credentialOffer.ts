import { OauthError } from "../../errors";
import {
	type ValidateCredentialOfferConfig,
	type ValidateGrantsConfig,
	validateCredentialOffer,
	validateGrants,
} from "../../statements";

export type CredentialOfferLocationConfig = ValidateCredentialOfferConfig &
	ValidateGrantsConfig;

type CredentialOfferProtocol = "oid4vci";

type CredentialOfferNextStep = "pushed_authorization_request";

export type CredentialOfferLocation = {
	credential_offer: string | null;
};

type PushedAuthorizationRequestMetadata = {
	issuer: string;
	credential_configuration_ids: Array<string>;
	issuer_state: string | undefined;
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

	const { grant_types, issuer_state } = await validateGrants(
		{ credential_configuration_ids, issuer, grants },
		config,
	);

	if (grant_types.includes("authorization_code")) {
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
		400,
		"invalid_location",
		"credential offer grants is not supported",
	);
}
