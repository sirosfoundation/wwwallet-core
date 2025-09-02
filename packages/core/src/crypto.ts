import crypto from "node:crypto";
import type { JWTDecryptOptions, JWTDecryptResult } from "jose";
import { jwtDecrypt } from "jose";
import { JWEDecryptionFailed } from "jose/errors";

export async function secretDerivation(
	secret: string,
	count: number,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const rawCount = new Uint8Array(8);
		for (let i = 0; i < rawCount.length; i++) {
			rawCount[i] = count % 256;
			count = Math.floor(count / 256);
		}

		crypto.hkdf("sha256", secret, rawCount, "info", 64, (error, derivedKey) => {
			if (error) {
				return reject(error);
			}
			resolve(Buffer.from(derivedKey.slice(0, 16)).toString("hex"));
		});
	});
}

export type DecryptConfig = {
	secret: string;
	previous_secrets: string[];
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
