export const pushedAuthorizationRequestHandlerConfigSchema = {
	type: "object",
	properties: {
		secret: { type: "string", pattern: ".{16}|.{24}|.{32}|.{48}|.{64}|" },
		access_token_encryption: {
			type: "string",
			pattern:
				"A128GCM|A192GCM|A256GCM|A128CBC-HS256|A192CBC-HS384|A256CBC-HS512",
		},
		pushed_authorization_request_ttl: { type: "number" },
		clients: {
			type: "array",
			items: {
				type: "object",
				properties: {
					id: { type: "string" },
					redirect_uris: { type: "array", items: { type: "string" } },
					scopes: { type: "array", items: { type: "string" } },
				},
				required: ["id", "redirect_uris", "scopes"],
			},
		},
	},
	required: ["clients"],
};
