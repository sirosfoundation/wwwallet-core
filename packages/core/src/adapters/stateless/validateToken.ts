import { jwtDecrypt } from "jose";
import { JWEDecryptionFailed } from "jose/errors";

type TokenType = string;

const validateToken = async function (token_type: TokenType, token: string) {
	// @ts-ignore
	const options: TokenOptions = this.tokenOptions;

	if (!options.secret) {
		throw new Error("token validation requires a secret to be set");
	}
	const { payload } = await jwtDecrypt<unknown>(
		token,
		new TextEncoder().encode(options.secret),
	).catch((error) => {
		if (error instanceof JWEDecryptionFailed) {
			return jwtDecrypt<unknown>(
				token,
				new TextEncoder().encode(options.previous_secrets[0]),
			);
		}

		throw error;
	});

	if (payload.token_type !== token_type) {
		throw new Error("token is invalid");
	}

	return { payload };
};

export { validateToken };
