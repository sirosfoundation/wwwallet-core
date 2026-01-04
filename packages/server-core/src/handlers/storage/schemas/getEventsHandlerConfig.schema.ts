export const getEventsHandlerConfigSchema = {
	type: "object",
	properties: {
		eventStore: {},
		secret_base: { type: "string" },
		issuer_url: { type: "string" },
	},
	required: ["eventStore", "secret_base", "issuer_url"],
};
