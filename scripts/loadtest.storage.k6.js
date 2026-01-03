import { check } from "k6";
import { sha256 } from "k6/crypto";
import encoding, { b64encode } from "k6/encoding";
import http from "k6/http";

export const options = {
	vus: 1,
	iterations: 10,
};

function asciiToBytes(str) {
	// protected64 is ASCII; this is safe for AAD
	const out = new Uint8Array(str.length);
	for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
	return out;
}

function b64uToBytes(s) {
	return new Uint8Array(encoding.b64decode(s, "rawurl"));
}

function bytesToUtf8(buf) {
	// ArrayBuffer/Uint8Array -> string
	const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
	return encoding.b64decode(encoding.b64encode(u8), "standard", "s");
}

function u32be(n) {
	return new Uint8Array([
		(n >>> 24) & 255,
		(n >>> 16) & 255,
		(n >>> 8) & 255,
		n & 255,
	]);
}

function concatBytes(...arrs) {
	const len = arrs.reduce((s, a) => s + a.length, 0);
	const out = new Uint8Array(len);
	let off = 0;
	for (const a of arrs) {
		out.set(a, off);
		off += a.length;
	}
	return out;
}

async function concatKdfSha256(z, algorithmIdStr, apu, apv, keydatalenBits) {
	// OtherInfo = AlgorithmID || PartyUInfo || PartyVInfo || SuppPubInfo
	// where AlgorithmID/PartyUInfo/PartyVInfo are length-prefixed (32-bit)
	const algId = asciiToBytes(algorithmIdStr);

	const otherInfo = concatBytes(
		u32be(algId.length),
		algId,
		u32be(apu.length),
		apu,
		u32be(apv.length),
		apv,
		u32be(keydatalenBits),
	);

	// 1 iteration is enough for 256-bit key with SHA-256
	const counter = u32be(1);
	const input = concatBytes(counter, z, otherInfo);
	const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
	return digest.slice(0, keydatalenBits / 8);
}

function curveBits(crv) {
	if (crv === "P-256") return 256;
	if (crv === "P-384") return 384;
	if (crv === "P-521") return 528;
	throw new Error(`Unsupported crv: ${crv}`);
}

export async function decryptJweEcdhEsA256gcm(compactJwe, recipientPrivJwk) {
	const [protected64, encKey64, iv64, ct64, tag64] = compactJwe.split(".");
	if (!tag64) throw new Error("Not a compact JWE (expected 5 parts)");

	const header = JSON.parse(encoding.b64decode(protected64, "rawurl", "s"));
	if (header.alg !== "ECDH-ES")
		throw new Error(`alg must be ECDH-ES, got ${header.alg}`);
	if (header.enc !== "A256GCM")
		throw new Error(`enc must be A256GCM, got ${header.enc}`);
	if (!header.epk) throw new Error("Missing epk");

	// For ECDH-ES direct, encrypted_key is typically empty; if it's not, that’s suspicious.
	// (Not always fatal, but usually indicates it’s actually ECDH-ES+AxxxKW.)
	if (encKey64 && encKey64.length > 0) {
		throw new Error(
			"encrypted_key is non-empty: token may be ECDH-ES+AxxxKW, not ECDH-ES",
		);
	}

	const recipientPriv = await crypto.subtle.importKey(
		"jwk",
		recipientPrivJwk,
		{ name: "ECDH", namedCurve: recipientPrivJwk.crv },
		false,
		["deriveBits"],
	);

	const epkPub = await crypto.subtle.importKey(
		"jwk",
		header.epk,
		{ name: "ECDH", namedCurve: header.epk.crv },
		false,
		[],
	);

	const zBits = curveBits(header.epk.crv);
	const z = new Uint8Array(
		await crypto.subtle.deriveBits(
			{ name: "ECDH", public: epkPub },
			recipientPriv,
			zBits,
		),
	);

	const apu = header.apu ? b64uToBytes(header.apu) : new Uint8Array();
	const apv = header.apv ? b64uToBytes(header.apv) : new Uint8Array();

	const cekRaw = await concatKdfSha256(z, header.enc, apu, apv, 256);

	const cek = await crypto.subtle.importKey(
		"raw",
		cekRaw,
		{ name: "AES-GCM" },
		false,
		["decrypt"],
	);

	const iv = b64uToBytes(iv64);
	if (iv.length !== 12)
		throw new Error(`IV length is ${iv.length}, expected 12 for GCM`);

	const aad = asciiToBytes(protected64);

	const ciphertext = b64uToBytes(ct64);
	const tag = b64uToBytes(tag64);
	if (tag.length !== 16)
		throw new Error(`Tag length is ${tag.length}, expected 16`);

	const data = concatBytes(ciphertext, tag);

	const plaintextBuf = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
		cek,
		data,
	);

	return JSON.parse(bytesToUtf8(plaintextBuf));
}

async function generateDpop(access_token, htm, htu) {
	const { privateKey, publicKey } = await crypto.subtle.generateKey(
		{
			name: "ECDSA",
			namedCurve: "P-256",
		},
		true,
		["sign", "verify"],
	);
	const ath = sha256(access_token, "base64rawurl");

	const header = {
		typ: "dpop+jwt",
		alg: "ES256",
		jwk: await crypto.subtle.exportKey("jwk", publicKey),
	};
	const payload = {
		jti: "jti",
		htm,
		htu,
		iat: Math.floor(Date.now() / 1000),
		ath,
	};

	const encodedJwt =
		b64encode(JSON.stringify(header), "rawurl") +
		"." +
		b64encode(JSON.stringify(payload), "rawurl");

	const signature = await crypto.subtle.sign(
		{ name: "ECDSA", hash: { name: "SHA-256" } },
		privateKey,
		string2ArrayBuffer(encodedJwt),
	);

	return `${encodedJwt}.${b64encode(signature, "rawurl")}`;
}

async function generateAddressingRecord(eventHash) {
	const { privateKey } = await crypto.subtle.generateKey(
		{
			name: "ECDSA",
			namedCurve: "P-256",
		},
		true,
		["sign", "verify"],
	);

	const header = {
		typ: "jwt",
		alg: "ES256",
	};
	const payload = {
		hash: eventHash,
		encryption_key: {},
	};

	const encodedJwt =
		b64encode(JSON.stringify(header), "rawurl") +
		"." +
		b64encode(JSON.stringify(payload), "rawurl");

	const signature = await crypto.subtle.sign(
		{ name: "ECDSA", hash: { name: "SHA-256" } },
		privateKey,
		string2ArrayBuffer(encodedJwt),
	);

	return `${encodedJwt}.${b64encode(signature, "rawurl")}`;
}

// from k6 documentation
function string2ArrayBuffer(str) {
	const buf = new ArrayBuffer(str.length);
	const bufView = new Uint8Array(buf);
	for (let i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

// The default exported function is gonna be picked up by k6 as the entry point for the test script. It will be executed repeatedly in "iterations" for the whole duration of the test.
export default async function () {
	const { privateKey, publicKey } = await crypto.subtle.generateKey(
		{
			name: "ECDH",
			namedCurve: "P-256",
		},
		true,
		["deriveKey", "deriveBits"],
	);
	const publicKeyJwk = await crypto.subtle.exportKey("jwk", publicKey);
	const privteKeyJwk = await crypto.subtle.exportKey("jwk", privateKey);
	// credential offer
	const authorizationChallenge = http.post(
		"http://localhost:5000/authorization-challenge",
		JSON.stringify(publicKeyJwk),
		{
			headers: { "Content-Type": "application/jwk+json" },
		},
	);

	check(authorizationChallenge, {
		"authorizationChallenge is status 200": (r) => r.status === 200,
	});

	const challenge = JSON.parse(authorizationChallenge.body).challenge;

	const { access_token } = await decryptJweEcdhEsA256gcm(
		challenge,
		privteKeyJwk,
	);

	for (let i = 0; i < Math.floor(Math.random() * 50); i++) {
		const eventHash = sha256(
			(Date.now() + Math.random()).toString(),
			"base64rawurl",
		);
		const eventPayload = {
			addressing_table: [await generateAddressingRecord(eventHash)],
			events: [
				{
					hash: eventHash,
					payload: challenge,
				},
			],
		};

		const storeEvent = http.put(
			`http://localhost:5000/event-store/events/${eventHash}`,
			JSON.stringify(eventPayload),
			{
				headers: {
					"Content-Type": "application/jwk+json",
					Authorization: `DPoP ${access_token}`,
					DPoP: await generateDpop(
						access_token,
						"PUT",
						`http://localhost:5000/event-store/events/${eventHash}`,
					),
				},
			},
		);

		check(storeEvent, {
			"storeEvent is status 201": (r) => r.status === 201,
		});

		const fetchEvents = http.get(`http://localhost:5000/event-store/events`, {
			headers: {
				"Content-Type": "application/jwk+json",
				Authorization: `DPoP ${access_token}`,
				DPoP: await generateDpop(
					access_token,
					"GET",
					"http://localhost:5000/event-store/events",
				),
			},
		});

		check(fetchEvents, {
			"fetchEvents is status 200": (r) => r.status === 200,
		});
	}
}
