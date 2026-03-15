import { OauthError } from "../../errors";

export type ValidateCredentialConfigurationIdsParams = {
	credential_configuration_id?: unknown;
	credential_configuration_ids?: unknown;
};

export type ValidateCredentialConfigurationIdsConfig = unknown;

/**
 * Normalizes and validates credential configuration identifier inputs from
 * credential requests.
 *
 * ## Why
 * Credential issuance selection must fail fast on malformed configuration-id
 * containers so request parsing remains deterministic and safe.
 *
 * ## Specification
 * - OID4VCI credential request parameter handling.
 */
export async function validateCredentialConfigurationIds(
	{
		credential_configuration_id,
		credential_configuration_ids,
	}: ValidateCredentialConfigurationIdsParams,
	_config?: ValidateCredentialConfigurationIdsConfig,
) {
	const normalizedCredentialConfigurationIds =
		credential_configuration_ids ||
		(credential_configuration_id && [credential_configuration_id]);

	if (
		!normalizedCredentialConfigurationIds ||
		(Array.isArray(normalizedCredentialConfigurationIds) &&
			normalizedCredentialConfigurationIds.length === 0)
	) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential configuration ids are missing from body parameters",
		);
	}
	if (
		!Array.isArray(normalizedCredentialConfigurationIds) ||
		normalizedCredentialConfigurationIds.some(
			(configurationId) =>
				typeof configurationId !== "string" ||
				configurationId.trim().length === 0,
		)
	) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential configuration ids are invalid",
		);
	}

	return {
		credential_configuration_ids: normalizedCredentialConfigurationIds,
	};
}
