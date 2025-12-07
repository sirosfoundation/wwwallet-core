export const authorizationChallengeHandlerConfigSchema = {
	type: "object",
	properties: {
		secret_base: { type: "string" },
		access_token_ttl: { type: "number" },
		authorization_challenge_ttl: { type: "number" },
	},
	required: ["secret_base", "access_token_ttl", "authorization_challenge_ttl"],
};
