export const config = {
	clients: [
		{
			id: "id",
			secret: "secret",
			scopes: ["client:scope"],
		},
	],
	secret: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	access_token_encryption: "A128CBC-HS256",
	access_token_ttl: 3600 * 2,
};
