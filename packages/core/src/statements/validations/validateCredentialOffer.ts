import { OauthError } from "../../errors";

export type ValidateCredentialOfferParams = {
	credential_offer: string;
};

export type ValidateCredentialOfferConfig = {};

export async function validateCredentialOffer(
	{ credential_offer }: ValidateCredentialOfferParams,
	_config: ValidateCredentialOfferConfig,
) {
	try {
		const { credential_issuer, credential_configuration_ids, grants } =
			JSON.parse(credential_offer);

		return { credential_issuer, credential_configuration_ids, grants };
	} catch (_error) {
		throw new OauthError(
			400,
			"invalid_location",
			"credential offer could not be parsed",
		);
	}
}
