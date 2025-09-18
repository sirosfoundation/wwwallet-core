import { OauthError } from "../../errors";
import type { ClientStateStore } from "../../ports";
import type { ClientState } from "../../resources";

export type ClientStateParams = {
	issuer?: string;
	issuer_state?: string;
	state?: string;
};

export type ClientStateConfig = {
	clientStateStore: ClientStateStore;
};

export async function clientState(
	{ issuer, issuer_state, state }: ClientStateParams,
	config: ClientStateConfig,
) {
	let client_state: ClientState | undefined;

	if (state) {
		client_state = await config.clientStateStore.fromState(state);
	}

	if (issuer && issuer_state) {
		client_state = await config.clientStateStore.fromIssuerState(
			issuer,
			issuer_state,
		);
	}

	if (!client_state) {
		throw new OauthError("invalid_client", "client state could not be found");
	}

	return { client_state };
}
