import { EncryptJWT } from "jose";
import type { OauthClient } from "../../resources";

export type GenerateIssuerGrantsParams = {
	client: OauthClient;
	scope: string;
};

export type GenerateIssuerGrantsConfig = {
	secret: string;
	token_encryption: string;
	issuer_state_ttl: number;
};

export async function generateIssuerGrants(
	{ client, scope }: GenerateIssuerGrantsParams,
	config: GenerateIssuerGrantsConfig,
) {
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const issuer_state = await new EncryptJWT({ sub: client.id })
		.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + config.issuer_state_ttl)
		.encrypt(secret);

	const preauthorized_code = await new EncryptJWT({
		token_type: "preauthorized_code",
		client_id: client.id,
		sub: "preauthorized",
		scope,
	})
		.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + config.issuer_state_ttl)
		.encrypt(secret);

	const grants = {
		"urn:ietf:params:oauth:grant-type:pre-authorized_code": {
			"pre-authorized_code": preauthorized_code,
		},
		authorization_code: {
			issuer_state,
		},
	};

	return { grants };
}
