export const authorizationHandlerConfigSchema = {
	type: "object",
	properties: {
		httpClient: {},
		clientStateStore: {},
		wallet_url: { type: "string" },
		static_clients: {
			type: "array",
			items: {
				type: "object",
				properties: {
					client_id: { type: "string" },
					client_secret: { type: "string" },
					issuer: { type: "string" },
				},
				required: ["issuer", "client_id", "client_secret"],
			},
		},
	},
	required: ["httpClient", "clientStateStore", "wallet_url", "static_clients"],
};
