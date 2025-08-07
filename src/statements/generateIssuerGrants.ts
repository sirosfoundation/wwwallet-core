import type { Config } from "..";

export async function generateIssuerGrants(config: Config) {
	const issuerState = config.tokenGenerators.issuerState();

	const grants = {
		authorization_code: {
			issuer_state: issuerState,
		},
	};

	return { grants };
}
