import { decodeProtectedHeader, type JWK, jwtDecrypt, jwtVerify } from "jose";
import { OauthError } from "../../errors";
import type { OauthClient } from "../../resources";

export type ValidateProofsParams = {
	proofs: {
		jwt?: Array<string>;
		attestation?: Array<string>;
	};
	client: OauthClient;
};

export type ValidateProofsConfig = {
	secret: string;
};

export async function validateProofs(
	{ proofs, client }: ValidateProofsParams,
	config: ValidateProofsConfig,
) {
	if (!client) {
		throw new OauthError(
			400,
			"invalid_request",
			"proof must be associated with an issuer client",
		);
	}

	for (const proofType of Object.keys(proofs)) {
		if (proofType === "jwt" && proofs.jwt) {
			await validateJwtProofs({ proofs: proofs.jwt, client }, config);

			return { proofs };
		}

		throw new OauthError(400, "invalid_request", "unknown proof type");
	}

	return { proofs };
}

async function validateJwtProofs(
	{ proofs, client }: { proofs: Array<string>; client: OauthClient },
	config: ValidateProofsConfig,
) {
	let i = 0;
	for (const proof of proofs) {
		try {
			const { jwk }: { jwk?: JWK } = decodeProtectedHeader(proof);

			if (!jwk) {
				throw new OauthError(
					400,
					"invalid_request",
					`jwk header is missing in jwt proof #${i}`,
				);
			}

			const {
				payload: { nonce },
			} = await jwtVerify<{ nonce: string }>(proof, jwk);

			if (!nonce) {
				throw new OauthError(
					400,
					"invalid_request",
					`nonce claim is missing in jwt proof #${i}`,
				);
			}

			await validateNonce({ nonce, client, index: i }, config);
		} catch (error) {
			if (error instanceof OauthError) {
				throw error;
			}

			throw new OauthError(
				400,
				"invalid_request",
				`jwt proof #${i} is invalid`,
			);
		}

		i++;
	}
}

async function validateNonce(
	{
		nonce,
		client,
		index,
	}: { nonce: string; client: OauthClient; index: number },
	config: ValidateProofsConfig,
) {
	try {
		const secret = new TextEncoder().encode(config.secret);
		const {
			payload: { sub, token_type },
		} = await jwtDecrypt<{ sub: string; token_type: string }>(nonce, secret);

		if (token_type !== "c_nonce") {
			throw new OauthError(
				400,
				"invalid_request",
				`nonce token type is invalid in jwt proof #${index}`,
			);
		}

		if (sub !== client.id) {
			throw new OauthError(
				400,
				"invalid_request",
				`nonce subject is invalid in jwt proof #${index}`,
			);
		}
	} catch (error) {
		if (error instanceof OauthError) {
			throw error;
		}

		throw new OauthError(
			400,
			"invalid_request",
			`jwt proof #${index} nonce is invalid`,
		);
	}
}
