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

		if (!credential_issuer) {
			throw new OauthError(
				"invalid_location",
				"credential offer must contain a credential issuer parameter",
			);
		}

		if (!credential_configuration_ids) {
			throw new OauthError(
				"invalid_location",
				"credential offer must contain a credential configuration ids parameter",
			);
		}

		// TODO validate credential offer credential configuration id is present in issuer metadata
		if (!Array.isArray(credential_configuration_ids)) {
			throw new OauthError(
				"invalid_location",
				"credential offer credential configuration ids parameter is invalid",
			);
		}

		return { credential_issuer, credential_configuration_ids, grants };
	} catch (error) {
		if (error instanceof OauthError) {
			throw error;
		}

		throw new OauthError(
			"invalid_location",
			"credential offer could not be parsed",
			{ error },
		);
	}
}
