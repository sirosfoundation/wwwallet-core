import { EncryptJWT } from "jose";

type TokenType = string;

type TokenData = {
	[key: string]: string;
};

export type TokenOptions = {
	token_encryption: string;
	secret?: string;
	previous_secrets?: Array<string>;
};

const DEFAULT_TTL = 60;

const DEFAULT_TOKEN_ENCRYPTION = "A128CBC-HS256";

const generateToken = async function (
	token_type: TokenType,
	data: TokenData,
	ttl: number = DEFAULT_TTL,
) {
	// @ts-ignore
	const options: TokenOptions = this.tokenOptions;

	if (!options.secret) {
		throw new Error("token generation requires a secret to be set");
	}

	const token_encryption = options.token_encryption || DEFAULT_TOKEN_ENCRYPTION;

	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(options.secret);

	return new EncryptJWT({
		token_type,
		...data,
	})
		.setProtectedHeader({ alg: "dir", enc: token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + ttl)
		.encrypt(secret);
};

export { generateToken };
