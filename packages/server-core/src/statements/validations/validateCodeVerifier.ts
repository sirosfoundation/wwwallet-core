import crypto from "node:crypto";
import { OauthError } from "../../errors";

export type ValidateCodeVerifierParams = {
	code_verifier: string | undefined;
	code_challenge: string | undefined;
	code_challenge_method: string | undefined;
};

export type ValidateCodeVerifierConfig = {};

/**
 * Validates presence and correctness of PKCE inputs, then checks verifier hash
 *   against stored authorization challenge.
 *
 * ## Why
 * PKCE prevents intercepted authorization codes from being redeemed by an
 *   attacker who does not control the original verifier.
 *
 * Hardening references:
 * - `38ba7d0` harden PKCE verifier validation (`S256`, format checks).
 * - `71658d6` harden PKCE verifier comparison with constant-time equality.
 *
 * ## Specification
 * - PKCE (RFC 7636), `S256` transformation and verification.
 */
export async function validateCodeVerifier(
	{
		code_verifier,
		code_challenge,
		code_challenge_method,
	}: ValidateCodeVerifierParams,
	_config: ValidateCodeVerifierConfig,
) {
	if (!code_challenge) {
		throw new OauthError(
			400,
			"invalid_request",
			"code challenge is missing from authorization request",
		);
	}

	if (!code_challenge_method) {
		throw new OauthError(
			400,
			"invalid_request",
			"code challenge method is missing from authorization request",
		);
	}

	if (code_challenge_method !== "S256") {
		throw new OauthError(
			400,
			"invalid_request",
			"only S256 code challenge method is supported",
		);
	}

	if (!code_verifier) {
		throw new OauthError(
			400,
			"invalid_request",
			"Proof Key for Code Exchange requests require a code verifier",
		);
	}

	// RFC 7636 code verifier: 43-128 chars from unreserved URI set.
	if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(code_verifier)) {
		throw new OauthError(400, "invalid_request", "code verifier is invalid");
	}

	const challenge = crypto
		.createHash("sha256")
		.update(code_verifier)
		.digest("base64url");

	const expectedChallenge = Buffer.from(code_challenge);
	const providedChallenge = Buffer.from(challenge);
	const matches =
		expectedChallenge.length === providedChallenge.length &&
		crypto.timingSafeEqual(expectedChallenge, providedChallenge);

	if (!matches) {
		throw new OauthError(400, "invalid_request", "code verifier is invalid");
	}

	return {
		code_verifier,
		code_challenge,
		code_challenge_method,
	};
}
