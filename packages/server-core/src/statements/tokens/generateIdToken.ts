import { createHash } from "node:crypto";
import { SignJWT } from "jose";

export type GenerateIdTokenParams = {
	client_id: string;
	sub: string;
	nonce?: string;
	access_token?: string;
	authorization_code?: string;
};

export type GenerateIdTokenConfig = {
	issuer_url?: string;
	id_token_ttl?: number;
	secret: string;
};

function tokenHash(value: string) {
	const digest = createHash("sha256").update(value).digest();
	return digest.subarray(0, digest.length / 2).toString("base64url");
}

/**
 * Creates an OIDC ID Token with issuer, audience, subject and optional
 *   nonce/hash claims tied to front-channel artifacts.
 *
 * ## Why
 * OIDC clients require verifiable authentication context in addition to OAuth
 *   access delegation, especially for session establishment.
 *
 * ## Specification
 * - OpenID Connect Core 1.0 ID Token requirements.
 */
export async function generateIdToken(
	{
		client_id,
		sub,
		nonce,
		access_token,
		authorization_code,
	}: GenerateIdTokenParams,
	config: GenerateIdTokenConfig,
) {
	const now = Math.floor(Date.now() / 1000);
	const secret = new TextEncoder().encode(config.secret);
	const claims: {
		iss: string;
		sub: string;
		aud: string;
		nonce?: string;
		at_hash?: string;
		c_hash?: string;
	} = {
		iss: config.issuer_url || "",
		sub,
		aud: client_id,
	};

	if (nonce) claims.nonce = nonce;
	if (access_token) claims.at_hash = tokenHash(access_token);
	if (authorization_code) claims.c_hash = tokenHash(authorization_code);

	const id_token = await new SignJWT(claims)
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setIssuedAt(now)
		.setExpirationTime(now + (config.id_token_ttl || 60))
		.sign(secret);

	return { id_token };
}
