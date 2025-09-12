import { OauthError } from "../../errors";
import type { ClientStateStore } from "../../ports";
import type { Grants } from "../../resources";

export type ValidateGrantsParams = {
	issuer: string;
	grants: Grants | undefined;
	credential_configuration_ids: Array<string>;
};

export type ValidateGrantsConfig = {
	clientStateStore: ClientStateStore;
};

export async function validateGrants(
	{ issuer, grants, credential_configuration_ids }: ValidateGrantsParams,
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
		const clientState = await config.clientStateStore.create(
			issuer,
			issuer_state,
		);
		await config.clientStateStore.setCredentialConfigurationIds(
			clientState,
			credential_configuration_ids,
		);
	}

	return { grant_types, issuer_state };
}
