import { OauthError } from "../../errors";
import type { ResourceOwner } from "../../resources";

export type ValidateResourceOwnerParams = {
	resource_owner: ResourceOwner;
};

export type ValidateResourceOwnerConfig = unknown;

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
