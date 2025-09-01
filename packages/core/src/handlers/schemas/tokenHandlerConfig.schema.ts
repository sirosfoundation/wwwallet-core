export const tokenHandlerConfigSchema = {
	type: "object",
	properties: {
		logger: {},
		databaseOperations: {
			type: "object",
			properties: {
				generateToken: {},
			},
			required: ["generateToken"],
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
		secret: { type: "string", pattern: ".{16}|.{24}|.{32}|.{48}|.{64}|" },
		token_encryption: {
			type: "string",
			pattern:
				"A128GCM|A192GCM|A256GCM|A128CBC-HS256|A192CBC-HS384|A256CBC-HS512",
		},
		access_token_ttl: { type: "number" },
	},
	required: ["clients", "secret", "token_encryption", "access_token_ttl"],
};
