import { importJWK, SignJWT } from "jose";
import { v7 as uuid } from "uuid";
import type { ClientState } from "../../resources";

export type GenerateDpopParams = {
	client_state: ClientState;
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

/**
 * Generates a DPoP proof JWT bound to HTTP method, URL, and optional access token hash.
 *
 * ### Why (Security)
 * Proof of possession constrains token use to the holder key and target request.
 *
 * ### Specifications
 * - RFC 9449 (OAuth 2.0 Demonstrating Proof-of-Possession at the Application Layer (DPoP)) Section 4, DPoP proof JWT
 * - RFC 9449 (OAuth 2.0 Demonstrating Proof-of-Possession at the Application Layer (DPoP)) Section 4.2, required claims and ath
 * - RFC 9449 (OAuth 2.0 Demonstrating Proof-of-Possession at the Application Layer (DPoP)) Section 7, DPoP usage at token endpoint
 */
export async function generateDpop(
	{ client_state, access_token, htm, htu }: GenerateDpopParams,
	config: GenerateDpopConfig,
) {
	// TODO get key pair from client state
	const { publicKey, privateKey } = client_state.dpopKeyPair;
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

		payload.ath = btoa(String.fromCharCode(...new Uint8Array(hash)))
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");
	}

	const dpop = await new SignJWT(payload)
		.setProtectedHeader({
			typ: "dpop+jwt",
			alg: "ES256",
			jwk: publicKey,
		})
		.setExpirationTime(now + config.dpop_ttl_seconds)
		.sign(await importJWK(privateKey));

	return { dpop };
}
