export const credentialHandlerConfigSchema = {
	type: "object",
	properties: {
		secret: { type: "string" },
	},
	required: ["secret"],
};
