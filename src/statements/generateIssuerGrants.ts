import type { CredentialOfferHandlerConfig } from "../handlers";

export async function generateIssuerGrants(
	config: CredentialOfferHandlerConfig,
) {
	const issuerState = config.tokenGenerators.generateIssuerState();

	const grants = {
		authorization_code: {
			issuer_state: issuerState,
		},
	};

	return { grants };
}
