import { OauthError } from "../../errors";
import type { ClientStateStore } from "../../ports";
import type { Grants } from "../../resources";

export type ValidateGrantsParams = {
	issuer: string;
	grants: Grants | undefined;
};

export type ValidateGrantsConfig = {
	clientStateStore: ClientStateStore;
};

export async function validateGrants(
	{ issuer, grants }: ValidateGrantsParams,
	config: ValidateGrantsConfig,
) {
	if (!grants) {
		throw new OauthError(
			400,
			"invalid_location",
			"grants parameter is required",
		);
	}

	const grant_types: Array<"authorization_code"> = [];
	let issuer_state: string | undefined;

	if (grants.authorization_code) {
		grant_types.push("authorization_code");
		issuer_state = grants.authorization_code.issuer_state;
	}

	if (!grant_types.length) {
		throw new OauthError(
			400,
			"invalid_location",
			"no given authorization grant is not supported",
		);
	}

	if (issuer_state) {
		config.clientStateStore.create(issuer, issuer_state);
	}

	return { grant_types, issuer_state };
}
