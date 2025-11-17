import crypto from "node:crypto";
import { decodeProtectedHeader, exportJWK, type JWK, jwtVerify } from "jose";
import { type DecryptConfig, jwtDecryptWithConfigKeys } from "../../crypto";
import { OauthError } from "../../errors";
import type { IssuerClient } from "../../resources";

export type ValidateProofsParams = {
	proofs: {
		jwt?: Array<string>;
		attestation?: Array<string>;
		[key: string]: unknown;
	};
};

export type ValidateProofsConfig = {
	trusted_root_certificates: Array<string>;
	issuer_client: IssuerClient;
} & DecryptConfig;

export async function validateProofs(
	{ proofs }: ValidateProofsParams,
	config: ValidateProofsConfig,
) {
	let jwks: Array<JWK> = [];

	for (const proofType of Object.keys(proofs)) {
		if (proofType === "jwt" && proofs.jwt) {
			const { proofs: _jwtProofs, jwks: jwtJwks } = await validateJwtProofs(
				{ proofs: proofs.jwt },
				config,
			);

			jwks = jwks.concat(jwtJwks);
			continue;
		}

		if (proofType === "attestation" && proofs.attestation) {
			const { proofs: _attestationProofs, jwks: attestationJwks } =
				await validateAttestationProofs({ proofs: proofs.attestation }, config);
			jwks = jwks.concat(attestationJwks);
			continue;
		}

		throw new OauthError(400, "invalid_request", "unknown proof type");
	}

	return { proofs, jwks };
}

async function validateJwtProofs(
	{ proofs }: { proofs: Array<string> },
	config: ValidateProofsConfig,
) {
	const jwks = [];
	let i = 0;
	for (const proof of proofs) {
		try {
			const { jwk }: { jwk?: JWK } = decodeProtectedHeader(proof);

			if (!jwk) {
				throw new OauthError(
					400,
					"invalid_request",
					`jwk header is missing at jwt proof #${i}`,
				);
			}

			const {
				payload: { nonce },
			} = await jwtVerify<{ nonce: string | undefined }>(proof, jwk);

			await validateNonce({ nonce, type: "jwt", index: i }, config);
			jwks.push(jwk);
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

	return { proofs, jwks };
}

async function validateAttestationProofs(
	{ proofs }: { proofs: Array<string> },
	config: ValidateProofsConfig,
) {
	let i = 0;
	const jwks: Array<JWK> = [];
	for (const proof of proofs) {
		try {
			const header: { x5c?: Array<string> } = decodeProtectedHeader(proof);

			if (!header.x5c || !Array.isArray(header.x5c)) {
				throw new OauthError(
					400,
					"invalid_request",
					`x5c header is missing at attestation proof #${i}`,
				);
			}

			const { x5c } = await validateX5c({ x5c: header.x5c, index: i }, config);

			try {
				const publicKey = new crypto.X509Certificate(
					Buffer.from(x5c[0], "base64"),
				).publicKey;
				const {
					payload: { nonce },
				} = await jwtVerify<{ nonce: string | undefined }>(proof, publicKey);

				await validateNonce({ nonce, type: "attestation", index: i }, config);
				jwks.push(await exportJWK(publicKey));
			} catch (error) {
				if (error instanceof OauthError) {
					throw error;
				}

				throw new OauthError(
					400,
					"invalid_request",
					`invalid signature at attestation proof #${i}`,
				);
			}
		} catch (error) {
			if (error instanceof OauthError) {
				throw error;
			}

			throw new OauthError(
				400,
				"invalid_request",
				`attestation proof #${i} is invalid`,
			);
		}

		i++;
	}

	return { proofs, jwks };
}

async function validateNonce(
	{
		nonce,
		type,
		index,
	}: {
		nonce: string | undefined;
		type: string;
		index: number;
	},
	config: ValidateProofsConfig,
) {
	if (!nonce) {
		throw new OauthError(
			400,
			"invalid_request",
			`nonce claim is missing at ${type} proof #${index}`,
		);
	}

	try {
		const {
			payload: { sub, token_type },
		} = await jwtDecryptWithConfigKeys<{ sub: string; token_type: string }>(
			nonce,
			config,
		);

		if (token_type !== "c_nonce") {
			throw new OauthError(
				400,
				"invalid_request",
				`nonce token type is invalid at ${type} proof #${index}`,
			);
		}

		if (sub !== config.issuer_client.id) {
			throw new OauthError(
				400,
				"invalid_request",
				`nonce subject is invalid at ${type} proof #${index}`,
			);
		}
	} catch (error) {
		if (error instanceof OauthError) {
			throw error;
		}

		throw new OauthError(
			400,
			"invalid_request",
			`${type} proof #${index} nonce is invalid`,
		);
	}
}

async function validateX5c(
	{ x5c, index }: { x5c: Array<string>; index: number },
	config: ValidateProofsConfig,
): Promise<{ x5c: Array<string> }> {
	const verified = x5c.concat([]);
	config.trusted_root_certificates.forEach((trustedCertificate: string) => {
		const authority = new crypto.X509Certificate(trustedCertificate);

		x5c.forEach((raw: string) => {
			const certificate = new crypto.X509Certificate(
				Buffer.from(raw, "base64"),
			);

			if (
				certificate.checkIssued(authority) &&
				certificate.verify(authority.publicKey)
			) {
				verified.splice(verified.indexOf(raw), 1);
			}
		});
	});

	if (verified.length) {
		throw new OauthError(
			400,
			"invalid_request",
			`x5c certificate chain not trusted at attestation proof #${index}`,
		);
	}

	return { x5c };
}
