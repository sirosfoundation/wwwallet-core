import { EncryptJWT } from "jose";
import type { OauthClient, OauthScope } from "../../resources";

export type GenerateRefreshTokenParams = {
	client: OauthClient;
	scope: OauthScope;
	sub?: string;
};

export type GenerateRefreshTokenConfig = {
	refresh_token_ttl: number;
	token_encryption: string;
	secret: string;
};

export async function generateRefreshToken(
	{ client, sub: requestedSub, scope }: GenerateRefreshTokenParams,
	config: GenerateRefreshTokenConfig,
) {
	const sub = requestedSub || client.id;
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const refresh_token = await new EncryptJWT({
		token_type: "refresh_token",
		client_id: client.id,
		sub,
		scope,
	})
		.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + config.refresh_token_ttl)
		.encrypt(secret);

	return { refresh_token };
}
