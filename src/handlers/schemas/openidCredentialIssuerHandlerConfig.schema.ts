export const openidCredentialIssuerHandlerConfigSchema = {
	type: "object",
	properties: {
		issuer_url: { type: "string" }
	},
	required: [
		"issuer_url",
	],
};
