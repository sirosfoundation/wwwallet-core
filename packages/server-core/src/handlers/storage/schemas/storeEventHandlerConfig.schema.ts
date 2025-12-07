export const storeEventHandlerConfigSchema = {
	type: "object",
	properties: {
		events_path: { type: "string" },
		secret_base: { type: "string" },
		issuer_url: { type: "string" },
	},
	required: ["events_path", "secret_base", "issuer_url"],
};
