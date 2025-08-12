export const authorizeHandlerConfigSchema = {
	type: "object",
	properties: {
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
	},
	required: ["clients", "secret"],
};
