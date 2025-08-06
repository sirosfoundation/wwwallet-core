import type { Config } from "..";
import type { AuthorizationServerState } from "../resources";

type GenerateIssuerGrantsParams = {
	authorizationServerState: AuthorizationServerState;
};

export async function generateIssuerGrants(
	{ authorizationServerState }: GenerateIssuerGrantsParams,
	config: Config,
) {
	const issuerState = config.tokenGenerators.issuerState();

	const grants = {
		authorization_code: {
			issuer_state: issuerState,
		},
	};

	authorizationServerState.issuer_state = issuerState;

	return { authorizationServerState, grants };
}
