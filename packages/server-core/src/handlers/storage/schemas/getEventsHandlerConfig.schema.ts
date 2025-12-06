export const getEventsHandlerConfigSchema = {
	type: "object",
	properties: {
		events_path: { type: "string" },
		secret_base: { type: "string" },
	},
	required: ["events_path", "secret_base"],
};
