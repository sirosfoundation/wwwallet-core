export const authorizeHandlerConfigSchema = {
	type: "object",
	properties: {
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
		authorization_code_ttl: { type: "number" },
		secret: { type: "string", pattern: ".{16}|.{24}|.{32}|.{48}|.{64}|" },
		token_encryption: { type: "string" },
	},
	required: [
		"issuer_client",
		"clients",
		"secret",
		"authorization_code_ttl",
		"token_encryption",
	],
};
