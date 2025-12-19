export const getEventsHandlerConfigSchema = {
	type: "object",
	properties: {
		events_path: { type: "string" },
		event_tables_path: { type: "string" },
		secret_base: { type: "string" },
		issuer_url: { type: "string" },
	},
	required: ["events_path", "event_tables_path", "secret_base", "issuer_url"],
};
