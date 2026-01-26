import { OauthError } from "../../errors";
import type { ClientStateStore } from "../../ports";
import type { ClientState, Grants } from "../../resources";

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
		throw new OauthError("invalid_location", "grants parameter is required");
	}

	const grant_types: Array<"authorization_code" | "pre-authorized_code"> = [];
	let issuer_state: string | undefined;
	let preauthorized_code: string | undefined;

	if (grants.authorization_code) {
		grant_types.push("authorization_code");
		issuer_state = grants.authorization_code.issuer_state;
	}

	if (grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"]) {
		grant_types.push("pre-authorized_code");
		preauthorized_code =
			grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"][
				"pre-authorized_code"
			];
	}

	if (!grant_types.length) {
		throw new OauthError(
			"invalid_location",
			"given authorization grants are not supported",
		);
	}

	let client_state: ClientState | null = null;

	client_state = await config.clientStateStore.create(
		issuer,
		issuer_state || "",
	);
	client_state = await config.clientStateStore.setCredentialConfigurationIds(
		client_state,
		credential_configuration_ids,
	);

	return { grant_types, issuer_state, preauthorized_code, client_state };
}
