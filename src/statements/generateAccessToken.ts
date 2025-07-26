import { EncryptJWT } from "jose";
import type { Config } from "..";
import type { OauthClient, OauthScope } from "../resources";

export type generateAccessTokenParams = {
	client: OauthClient;
	scope: OauthScope;
};

export async function generateAccessToken(
	{ client, scope }: generateAccessTokenParams,
	config: Config,
) {
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const access_token = await new EncryptJWT({ sub: client.id, scope })
		.setProtectedHeader({ alg: "dir", enc: config.access_token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + config.access_token_ttl)
		.encrypt(secret);

	const expires_in = config.access_token_ttl;

	return { access_token, expires_in };
}
