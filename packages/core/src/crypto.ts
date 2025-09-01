import crypto from "node:crypto";

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
