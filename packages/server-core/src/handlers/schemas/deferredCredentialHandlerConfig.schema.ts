export const deferredCredentialHandlerConfigSchema = {
	type: "object",
	properties: {
		secret: { type: "string" },
		previous_secrets: { type: "array", items: { type: "string" } },
		issuer_url: { type: "string" },
		issuer_client: {
			type: "object",
			properties: {
				id: { type: "string" },
			},
			required: ["id"],
		},
		clients: {
			type: "array",
			items: {
				type: "object",
				properties: {
					id: { type: "string" },
					secret: { type: "string" },
					scopes: { type: "array", items: { type: "string" } },
				},
				required: ["id", "secret", "scopes"],
			},
		},
	},
	required: [],
};
