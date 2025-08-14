import { EncryptJWT } from "jose";
import type { OauthClient } from "../../resources";

export type GenerateIssuerGrantsParams = {
	client: OauthClient;
};

export type GenerateIssuerGrantsConfig = {
	secret: string;
	token_encryption: string;
	issuer_state_ttl: number;
};

export async function generateIssuerGrants(
	{ client }: GenerateIssuerGrantsParams,
	config: GenerateIssuerGrantsConfig,
) {
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const issuer_state = await new EncryptJWT({ sub: client.id })
		.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + config.issuer_state_ttl)
		.encrypt(secret);

	const grants = {
		authorization_code: {
			issuer_state,
		},
	};

	return { grants };
}
