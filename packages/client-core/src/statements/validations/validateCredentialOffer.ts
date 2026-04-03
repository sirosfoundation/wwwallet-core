import { OauthError } from "../../errors";

export type ValidateCredentialOfferParams = {
	credential_offer: string;
};

export type ValidateCredentialOfferConfig = {};

/**
 * Parses and validates required credential offer fields.
 *
 * ### Why (Security)
 * Strict input validation prevents malformed offers from steering issuance flow.
 *
 * ### Specifications
 * - OpenID4VCI, credential offer object
 * - OpenID4VCI, credential_issuer and credential_configuration_ids
 * - OpenID4VCI, grants object structure
 */
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
