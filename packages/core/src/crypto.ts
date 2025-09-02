import crypto from "node:crypto";

export async function secretDerivation(
	secret: string,
	count: number,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const rawCount = I2OSP(count, 8);

		crypto.hkdf("sha256", secret, rawCount, "info", 16, (error, derivedKey) => {
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
