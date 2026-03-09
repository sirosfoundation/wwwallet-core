import { OauthError } from "../../errors";
import type { ResourceOwner } from "../../resources";

export type ValidateResourceOwnerParams = {
	resource_owner: ResourceOwner;
};

export type ValidateResourceOwnerConfig = unknown;

/**
 * What:
 * - Validates that authenticated resource owner context includes a usable subject.
 *
 * Why:
 * - Authorization and token issuance require a stable subject to represent who
 *   granted access and who resulting credentials/tokens belong to.
 *
 * Specification:
 * - OAuth 2.0 resource owner authorization semantics (RFC 6749).
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
