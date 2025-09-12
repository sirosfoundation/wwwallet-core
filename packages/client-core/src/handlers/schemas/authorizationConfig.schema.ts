export const authorizationHandlerConfigSchema = {
	type: "object",
	properties: {
		httpClient: {},
		wallet_url: { type: "string" },
		static_clients: {
			type: "array",
			items: {
				type: "object",
				properties: {
					client_id: { type: "string" },
					issuer: { type: "string" },
					purpose: { type: "string" },
				},
			},
		},
	},
	required: [],
};
