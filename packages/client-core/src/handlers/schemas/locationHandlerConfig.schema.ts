export const locationHandlerConfigSchema = {
	type: "object",
	properties: {
		httpClient: {},
		clientStateStore: {},
	},
	required: ["httpClient", "clientStateStore"],
};
