import {
	calculateJwkThumbprint,
	EncryptJWT,
	importJWK,
	type JWK,
	SignJWT,
} from "jose";
import { OauthError } from "../../errors";

export type GenerateAuthorizationChallengeParams = {
	jwk: JWK;
};

export type GenerateAuthorizationChallengeConfig = {
	secret_base: string;
};

export async function generateAuthorizationChallenge(
	{ jwk }: GenerateAuthorizationChallengeParams,
	config: GenerateAuthorizationChallengeConfig,
) {
	const now = Date.now() / 1000;
	const secret = new TextEncoder().encode(config.secret_base);

	try {
		const appToken = await new SignJWT({
			keyid: await calculateJwkThumbprint(jwk),
		})
			.setExpirationTime(now + 900)
			.setProtectedHeader({ alg: "HS256" })
			.sign(secret);

		const challenge = await new EncryptJWT({ appToken })
			.setExpirationTime(now + 900)
			.setProtectedHeader({ enc: "A256GCM", alg: "RSA-OAEP-256" })
			.encrypt(await importJWK(jwk, "RSA-OAEP-256"));

		return { challenge };
	} catch (error) {
		throw new OauthError(
			400,
			"invalid_request",
			(error as Error).message.toLowerCase(),
		);
	}
}
