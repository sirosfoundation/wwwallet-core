export const sendPresentationConfigSchema = {
	type: "object",
	properties: {
		httpClient: {},
		vpTokenSigner: {},
	},
	required: ["httpClient", "vpTokenSigner"],
};
