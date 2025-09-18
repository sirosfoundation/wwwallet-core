export const credentialHandlerConfigSchema = {
	type: "object",
	properties: {
		httpClient: {},
		clientStateStore: {},
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
	required: ["httpClient", "clientStateStore", "static_clients"],
};
