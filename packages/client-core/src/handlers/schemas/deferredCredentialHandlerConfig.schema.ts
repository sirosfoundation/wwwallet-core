export const deferredCredentialHandlerConfigSchema = {
	type: "object",
	properties: {
		httpClient: {},
		clientStateStore: {},
		dpop_ttl_seconds: { type: "number" },
	},
	required: ["httpClient", "clientStateStore", "dpop_ttl_seconds"],
};
