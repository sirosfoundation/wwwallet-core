export const pushedAuthorizationRequestHandlerConfigSchema = {
	type: "object",
	properties: {
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
