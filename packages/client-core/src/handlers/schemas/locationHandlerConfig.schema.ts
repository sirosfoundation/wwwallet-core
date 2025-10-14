export const locationHandlerConfigSchema = {
	type: "object",
	properties: {
		httpClient: {},
		clientStateStore: {},
		dpop_ttl_seconds: { type: "number" },
		wallet_callback_url: { type: "string" },
		static_clients: {
			type: "array",
			items: {
				type: "object",
				properties: {
					issuer: { type: "string" },
					client_id: { type: "string" },
					client_secret: { type: "string" },
				},
				required: ["issuer", "client_id", "client_secret"],
			},
		},
	},
	required: [
		"httpClient",
		"wallet_callback_url",
		"clientStateStore",
		"static_clients",
		"dpop_ttl_seconds",
	],
};
