import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { v7 as uuid } from "uuid";

export type GenerateDpopParams = {
	access_token?: string;
	htm: string;
	htu: string;
};

export type GenerateDpopConfig = {
	dpop_ttl_seconds: number;
};

type DpopPayload = {
	jti: string;
	htm: string;
	htu: string;
	iat: number;
	ath?: string;
};

export async function generateDpop(
	{ access_token, htm, htu }: GenerateDpopParams,
	config: GenerateDpopConfig,
) {
	// TODO get key pair from client state
	const { publicKey, privateKey } = await generateKeyPair("ES256");
	const now = Math.floor(Date.now() / 1000);

	const payload: DpopPayload = {
		jti: uuid(),
		htm,
		htu,
		iat: now,
	};

	if (access_token) {
		const rawAccessToken = new TextEncoder().encode(access_token);
		const hash = await crypto.subtle.digest("SHA-256", rawAccessToken);

		payload.ath = btoa(String.fromCharCode(...new Uint8Array(hash)));
	}

	const dpop = await new SignJWT(payload)
		.setProtectedHeader({ alg: "ES256", jwk: await exportJWK(publicKey) })
		.setExpirationTime(now + config.dpop_ttl_seconds)
		.sign(privateKey);

	return { dpop };
}
