export const openidCredentialIssuerHandlerConfigSchema = {
	type: "object",
	properties: {
		issuer_url: { type: "string" },
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
					display: {
						type: "array",
						items: {
							type: "object",
							properties: {
								name: { type: "string" },
								description: { type: "string" },
								background_image: {
									type: "object",
									properties: { uri: { type: "string" } },
									required: ["uri"],
								},
								background_color: { type: "string" },
								text_color: { type: "string" },
								locale: { type: "string" },
							},
							required: ["name", "locale"],
						},
					},
				},
				required: ["credential_configuration_id", "scope", "format", "display"],
			},
		},
	},
	required: ["issuer_url", "supported_credential_configurations"],
};
