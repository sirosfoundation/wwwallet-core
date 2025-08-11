export const oauthAuthorizationServerHandlerConfigSchema = {
	type: "object",
	properties: {
		issuer_url: { type: "string" },
		clients: {
			type: "array",
			items: {
				type: "object",
				properties: {
					scopes: { type: "array", items: { type: "string" } },
				},
				required: ["scopes"],
			},
		},
		issuer_client: {
			type: "object",
			properties: {
				scopes: { type: "array", items: { type: "string" } },
			},
			required: ["scopes"],
		},
	},
	required: ["issuer_url", "clients", "issuer_client"],
};
