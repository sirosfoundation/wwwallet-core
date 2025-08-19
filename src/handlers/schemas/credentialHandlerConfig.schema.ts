export const credentialHandlerConfigSchema = {
	type: "object",
	properties: {
		databaseOperations: {
			type: "object",
			properties: {
				resourceOwnerData: {},
			},
			required: ["resourceOwnerData"],
		},
		secret: { type: "string" },
	},
	required: ["databaseOperations", "secret"],
};
