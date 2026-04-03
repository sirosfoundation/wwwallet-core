import { OauthError } from "../../errors";
import type { ResourceOwner } from "../../resources";

export type ValidateResourceOwnerParams = {
	resource_owner: ResourceOwner;
};

export type ValidateResourceOwnerConfig = unknown;

/**
 * Validates resource owner subject presence before authorization or issuance actions.
 *
 * ### Why (Security)
 * Subject checks prevent issuing artifacts without a stable principal identity.
 *
 * ### Specifications
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 1.1, resource owner role
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 4.1, authorization bound to resource owner
 * - OpenID4VCI, subject binding during issuance
 */
export async function validateResourceOwner(
	{ resource_owner }: ValidateResourceOwnerParams,
	_config: ValidateResourceOwnerConfig,
) {
	if (!resource_owner.sub) {
		throw new OauthError(
			401,
			"invalid_resource_owner",
			"resource owner is invalid",
		);
	}

	return { resource_owner };
}
