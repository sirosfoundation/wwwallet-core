import crypto from "node:crypto";

export function secretDerivation(secret: string, count: number) {
	const rawCount = new Uint8Array(8);
	for (let i = 0; i < rawCount.length; i++) {
		rawCount[i] = count % 256;
		count = Math.floor(count / 256);
	}

	const rawHmac = crypto.createHmac("sha1", rawCount).update(secret).digest();

	let offset = rawHmac.at(3) as number;
	let i = 0;
	while (i < 2) {
		offset = Math.floor(offset / 8);
		i++;
	}
	offset = offset % 8;

	return rawHmac.slice(offset, offset + 16).toString("hex");
}
