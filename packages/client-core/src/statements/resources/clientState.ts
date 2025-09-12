import { OauthError } from "../../errors";
import type { ClientStateStore } from "../../ports";

export type ClientStateParams = {
	issuer: string;
	issuer_state: string;
};

export type ClientStateConfig = {
	clientStateStore: ClientStateStore;
};

export async function clientState(
	{ issuer, issuer_state }: ClientStateParams,
	config: ClientStateConfig,
) {
	const client_state = await config.clientStateStore.fromIssuerState(
		issuer,
		issuer_state,
	);

	if (!client_state) {
		throw new OauthError(
			400,
			"invalid_client",
			"client state could not be found",
		);
	}

	return { client_state };
}
