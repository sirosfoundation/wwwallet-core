export const authorizationChallengeHandlerConfigSchema = {
	type: "object",
	properties: {
		secret_base: { type: "string" },
	},
	required: ["secret_base"],
};
