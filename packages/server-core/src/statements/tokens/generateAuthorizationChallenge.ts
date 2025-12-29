import crypto from "node:crypto";
import {
	calculateJwkThumbprint,
	EncryptJWT,
	importJWK,
	type JWK,
	type JWTPayload,
	SignJWT,
} from "jose";
import { OauthError } from "../../errors";

export type GenerateAuthorizationChallengeParams = {
	jwk: JWK;
	tokenPayload: JWTPayload;
};

export type GenerateAuthorizationChallengeConfig = {
	secret_base: string;
	authorization_challenge_ttl: number;
	access_token_ttl: number;
};

export async function generateAuthorizationChallenge(
	{ jwk, tokenPayload }: GenerateAuthorizationChallengeParams,
	config: GenerateAuthorizationChallengeConfig,
) {
	const now = Date.now() / 1000;
	const secret = new TextEncoder().encode(config.secret_base);

	try {
		const keyid = crypto
			.createHash("sha256")
			.update(await calculateJwkThumbprint(jwk))
			.digest("base64url");
		const access_token = await new SignJWT({
			keyid,
			...tokenPayload,
		})
			.setExpirationTime(now + config.access_token_ttl)
			.setProtectedHeader({ alg: "HS256" })
			.sign(secret);

		const challenge = await new EncryptJWT({ access_token })
			.setExpirationTime(now + config.authorization_challenge_ttl)
			.setProtectedHeader({ enc: "A256GCM", alg: "ECDH-ES" })
			.encrypt(await importJWK(jwk, "ECDH-ES"));

		return { challenge };
	} catch (error) {
		throw new OauthError(
			400,
			"invalid_request",
			(error as Error).message.toLowerCase(),
			{ error },
		);
	}
}
