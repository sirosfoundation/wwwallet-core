import { EncryptJWT } from "jose";
import type { OauthClient } from "../../resources";

export type GenerateCNonceParams = {
	issuer_client: OauthClient;
};

export type GenerateCNonceConfig = {
	access_token_ttl: number;
	token_encryption: string;
	secret: string;
};

export async function generateCNonce(
	{ issuer_client: client }: GenerateCNonceParams,
	config: GenerateCNonceConfig,
) {
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const c_nonce = await new EncryptJWT({
		token_type: "c_nonce",
		sub: client.id,
	})
		.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + config.access_token_ttl)
		.encrypt(secret);

	return { c_nonce };
}
