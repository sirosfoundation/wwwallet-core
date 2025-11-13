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

type CredentialOfferNextStep = "authorization_request";

export type CredentialOfferLocation = {
	credential_offer: string | null;
};

export type CredentialOfferResponse = {
	protocol: CredentialOfferProtocol;
	nextStep: CredentialOfferNextStep;
	data: {
		issuer: string;
		credential_configuration_ids: Array<string>;
		issuer_state: string | undefined;
	};
};

const protocol = "oid4vci";
const nextStep = "authorization_request";

export async function handleCredentialOffer(
	location: CredentialOfferLocation,
	config: CredentialOfferLocationConfig,
): Promise<CredentialOfferResponse> {
	try {
		return await doHandleCredentialOffer(location, config);
	} catch (error) {
		if (error instanceof OauthError) {
			throw error.toResponse({ protocol, nextStep });
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

	const { grant_types, issuer_state, client_state } = await validateGrants(
		{ credential_configuration_ids, issuer, grants },
		config,
	);

	if (client_state) {
		await config.clientStateStore.commitChanges(client_state);
	}

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
		"invalid_location",
		"credential offer grants is not supported",
	);
}
