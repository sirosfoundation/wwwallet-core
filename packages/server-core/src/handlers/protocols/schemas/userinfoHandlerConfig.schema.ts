export const userinfoHandlerConfigSchema = {
	type: "object",
	properties: {
		clients: {
			type: "array",
			items: {
				type: "object",
				properties: {
					id: { type: "string" },
					scopes: { type: "array", items: { type: "string" } },
				},
				required: ["id", "scopes"],
			},
		},
		issuer_client: {
			type: "object",
			properties: {
				id: { type: "string" },
				scopes: { type: "array", items: { type: "string" } },
			},
			required: ["id", "scopes"],
		},
		secret: { type: "string", pattern: ".{16}|.{24}|.{32}|.{48}|.{64}|" },
		token_encryption: {
			type: "string",
			pattern:
				"A128GCM|A192GCM|A256GCM|A128CBC-HS256|A192CBC-HS384|A256CBC-HS512",
		},
		issuer_url: { type: "string" },
	},
	required: [
		"clients",
		"issuer_client",
		"secret",
		"token_encryption",
		"issuer_url",
	],
};
