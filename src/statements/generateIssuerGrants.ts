export type GenerateIssuerGrantsConfig = {
	tokenGenerators: {
		generateIssuerState: () => string;
	};
};

export async function generateIssuerGrants(config: GenerateIssuerGrantsConfig) {
	const issuerState = config.tokenGenerators.generateIssuerState();

	const grants = {
		authorization_code: {
			issuer_state: issuerState,
		},
	};

	return { grants };
}
