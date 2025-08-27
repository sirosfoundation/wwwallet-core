import crypto from "node:crypto";
import { OauthError } from "../../errors";

export type ValidateCodeVerifierParams = {
	code_verifier: string | undefined;
	code_challenge: string | undefined;
	code_challenge_method: string | undefined;
};

export type ValidateCodeVerifierConfig = {};

export async function validateCodeVerifier(
	{
		code_verifier,
		code_challenge,
		code_challenge_method,
	}: ValidateCodeVerifierParams,
	_config: ValidateCodeVerifierConfig,
): Promise<unknown> {
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

	const challenge = crypto
		.createHash("sha256")
		.update(code_verifier)
		.digest("base64url");

	if (challenge !== code_challenge) {
		throw new OauthError(400, "invalid_request", "code verifier is invalid");
	}

	return {
		code_verifier,
		code_challenge,
		code_challenge_method,
	};
}
