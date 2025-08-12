import { EncryptJWT } from "jose";
import type { OauthClient, OauthScope } from "../../resources";

export type GenerateAccessTokenParams = {
	client: OauthClient;
	scope: OauthScope;
};

export type GenerateAccessTokenConfig = {
	access_token_ttl: number;
	token_encryption: string;
	secret: string;
};

export async function generateAccessToken(
	{ client, scope }: GenerateAccessTokenParams,
	config: GenerateAccessTokenConfig,
) {
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const access_token = await new EncryptJWT({ sub: client.id, scope })
		.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + config.access_token_ttl)
		.encrypt(secret);

	const expires_in = config.access_token_ttl;

	return { access_token, expires_in };
}
