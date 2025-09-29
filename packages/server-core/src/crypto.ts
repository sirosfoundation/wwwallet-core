import crypto from "node:crypto";
import type { JWTDecryptOptions, JWTDecryptResult } from "jose";
import { jwtDecrypt } from "jose";
import { JWEDecryptionFailed } from "jose/errors";

export async function secretDerivation(
	secret: string,
	count: number,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const rawCount = I2OSP(count, 8);

		crypto.hkdf("sha256", secret, rawCount, "info", 32, (error, derivedKey) => {
			if (error) {
				return reject(error);
			}
			resolve(Buffer.from(derivedKey).toString("hex"));
		});
	});
}

export function I2OSP(a: bigint | number, length: number): Uint8Array {
	if (typeof a === "number") {
		return I2OSP(BigInt(a), length);
	} else {
		return new Uint8Array(length).map((_, i: number): number =>
			Number(BigInt.asUintN(8, a >> (BigInt(length - 1 - i) * 8n))),
		);
	}
}

export type DecryptConfig = {
	secret: string;
	previous_secrets: Array<string>;
};
export async function jwtDecryptWithConfigKeys<T>(
	jwt: string | Uint8Array,
	config: DecryptConfig,
	options?: JWTDecryptOptions,
): Promise<JWTDecryptResult<T>> {
	const encoder = new TextEncoder();

	let key = encoder.encode(config.secret);
	let fallback_i = -1;
	while (true) {
		try {
			return await jwtDecrypt<T>(jwt, key, options);
		} catch (error) {
			++fallback_i;
			if (
				error instanceof JWEDecryptionFailed &&
				fallback_i < config.previous_secrets.length
			) {
				key = encoder.encode(config.previous_secrets[fallback_i]);
				continue;
			}
			throw error;
		}
	}
}
