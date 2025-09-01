export const credentialHandlerConfigSchema = {
	type: "object",
	properties: {
		databaseOperations: {
			type: "object",
			properties: {
				resourceOwnerData: {},
				validateToken: {},
			},
			required: ["resourceOwnerData", "validateToken"],
		},
		secret: { type: "string" },
	},
	required: ["databaseOperations", "secret"],
};
