import { EncryptJWT } from "jose";
import type { Config } from "..";
import type { OauthClient } from "../resources";

export type generateAccessTokenParams = {
	client: OauthClient;
};

export async function generateAccessToken(
	{ client }: generateAccessTokenParams,
	config: Config,
) {
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const access_token = await new EncryptJWT({ sub: client.id })
		.setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
		.setIssuedAt()
		.setExpirationTime(now + config.access_token_ttl)
		.encrypt(secret);

	const expires_in = config.access_token_ttl;

	return { access_token, expires_in };
}
