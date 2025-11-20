export const credentialOfferHandlerConfigSchema = {
	type: "object",
	properties: {
		issuer_url: { type: "string" },
		wallet_url: { type: "string" },
		issuer_client: {
			type: "object",
			properties: {
				id: { type: "string" },
				scopes: { type: "array", items: { type: "string" } },
			},
			required: ["scopes"],
		},
		secret: { type: "string" },
		token_encryption: { type: "string" },
		issuer_state_ttl: { type: "number" },
		supported_credential_configurations: {
			type: "array",
			items: {
				type: "object",
				properties: {
					credential_configuration_id: { type: "string" },
					label: { type: "string" },
					scope: { type: "string" },
					format: { type: "string" },
					vct: { type: "string" },
				},
				required: ["credential_configuration_id", "scope", "format"],
			},
		},
	},
	required: [
		"dataOperations",
		"issuer_url",
		"wallet_url",
		"issuer_client",
		"secret",
		"token_encryption",
		"issuer_state_ttl",
		"supported_credential_configurations",
	],
};
