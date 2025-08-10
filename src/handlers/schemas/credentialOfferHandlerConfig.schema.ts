export const credentialOfferHandlerConfigSchema = {
	type: "object",
	properties: {
		databaseOperations: {
			type: "object",
			properties: {
				insertAuthorizationServerState: {},
			},
			required: ["insertAuthorizationServerState"],
		},
		tokenGenerators: {
			type: "object",
			properties: {
				generateIssuerState: {},
			},
			required: ["generateIssuerState"],
		},
		issuer_url: { type: "string" },
		wallet_url: { type: "string" },
		issuer_client: {
			type: "object",
			properties: {
				scopes: { type: "array", items: { type: "string" } },
			},
			required: ["scopes"],
		},
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
		"databaseOperations",
		"tokenGenerators",
		"issuer_url",
		"wallet_url",
		"issuer_client",
		"supported_credential_configurations",
	],
};
