import fs from "node:fs";
import path from "node:path";
import {
	calculateJwkThumbprint,
	EncryptJWT,
	exportJWK,
	generateKeyPair,
	jwtDecrypt,
	jwtVerify,
	type KeyObject,
	SignJWT,
} from "jose";
import request from "supertest";
import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import { app, protocols } from "../support/app";

describe("storage - retrieving events", () => {
	afterEach(() => {
		const stores = fs.readdirSync(protocols.config.events_path || "");
		for (const store of stores) {
			if (store === ".keep") continue;
			fs.rmSync(path.join(protocols.config.events_path || "", store), {
				recursive: true,
			});
		}
	});

	it("returns unauthorized", async () => {
		const keyid = "unknown";
		const response = await request(app).get(`/event-store/events/${keyid}`);

		expect(response.status).to.eq(401);
		expect(response.body).to.deep.eq({
			error: "authorization bearer is required",
		});
	});

	describe("with a valid bearer", () => {
		let appTokenPublicKey: KeyObject;
		let appToken: string;
		beforeEach(async () => {
			const now = Date.now() / 1000;
			const { publicKey } = await generateKeyPair("RSA-OAEP-256");
			const secret = new TextEncoder().encode(protocols.config.secret_base);
			appTokenPublicKey = publicKey;
			appToken = await new SignJWT({
				keyid: await calculateJwkThumbprint(await exportJWK(publicKey)),
			})
				.setExpirationTime(now + 10)
				.setProtectedHeader({ alg: "HS256" })
				.sign(secret);
		});

		it("returns empty event list", async () => {
			const keyid = "unknown";
			const response = await request(app)
				.get(`/event-store/events/${keyid}`)
				.set("Authorization", `Bearer ${appToken}`);

			expect(response.status).to.eq(200);
			expect(response.body).to.deep.eq({
				events: {},
			});
		});

		it("returns empty event list with a valid keyid", async () => {
			const keyid = await calculateJwkThumbprint(appTokenPublicKey);
			const response = await request(app)
				.get(`/event-store/events/${keyid}`)
				.set("Authorization", `Bearer ${appToken}`);

			expect(response.status).to.eq(200);
			expect(response.body).to.deep.eq({
				events: {},
			});
		});

		it("returns an event list with events stored", async () => {
			const keyid = await calculateJwkThumbprint(appTokenPublicKey);
			const eventHash = "a";
			const event = "event";
			fs.mkdirSync(path.join(protocols.config.events_path || "", keyid));
			fs.writeFileSync(
				path.join(protocols.config.events_path || "", keyid, eventHash),
				event,
			);
			const response = await request(app)
				.get(`/event-store/events/${keyid}`)
				.set("Authorization", `Bearer ${appToken}`);

			expect(response.status).to.eq(200);
			expect(response.body).to.deep.eq({
				events: {
					[eventHash]: event,
				},
			});
		});
	});
});

describe("storage - store events", () => {
	afterEach(() => {
		const stores = fs.readdirSync(protocols.config.events_path || "");
		for (const store of stores) {
			if (store === ".keep") continue;
			fs.rmSync(path.join(protocols.config.events_path || "", store), {
				recursive: true,
			});
		}
	});

	it("returns unauthorized", async () => {
		const eventHash = "a";
		const response = await request(app).put(`/event-store/events/${eventHash}`);

		expect(response.status).to.eq(401);
		expect(response.body).to.deep.eq({
			error: "authorization bearer is required",
		});
	});

	describe("with a valid bearer", () => {
		let appTokenPublicKey: KeyObject;
		let appToken: string;
		beforeEach(async () => {
			const now = Date.now() / 1000;
			const { publicKey } = await generateKeyPair("RSA-OAEP-256");
			const secret = new TextEncoder().encode(protocols.config.secret_base);
			appTokenPublicKey = publicKey;
			appToken = await new SignJWT({
				keyid: await calculateJwkThumbprint(await exportJWK(publicKey)),
			})
				.setExpirationTime(now + 10)
				.setProtectedHeader({ alg: "HS256" })
				.sign(secret);
		});

		it("returns an error", async () => {
			const eventHash = "a";
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Authorization", `Bearer ${appToken}`);

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "application/jose body is required",
			});
		});

		it("returns an error without body", async () => {
			const eventHash = "a";
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Content-Type", "application/jose")
				.set("Authorization", `Bearer ${appToken}`);

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid token or protected header formatting",
			});
		});

		it("stores an event with jwe body", async () => {
			const eventHash = "a";
			const { publicKey } = await generateKeyPair("ECDH-ES");
			const event = await new EncryptJWT({})
				.setProtectedHeader({ alg: "ECDH-ES", enc: "A256CBC-HS512" })
				.encrypt(publicKey);
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Content-Type", "application/jose")
				.set("Authorization", `Bearer ${appToken}`)
				.send(event);

			const storedEvent = fs.readFileSync(
				path.join(
					protocols.config.events_path || "",
					await calculateJwkThumbprint(appTokenPublicKey),
					eventHash,
				),
			);
			expect(storedEvent.toString()).to.eq(event);

			expect(response.status).to.eq(200);
			expect(response.body).to.deep.eq({
				[eventHash]: event,
			});
		});
	});
});

describe("storage - authentication", () => {
	it("returns an error", async () => {
		const response = await request(app).post(`/key-auth/challenge`);

		expect(response.status).to.eq(400);
		expect(response.body).to.deep.eq({
			error: "application/jwk+json body is required",
		});
	});

	it("returns an error with an empty body", async () => {
		const response = await request(app)
			.post(`/key-auth/challenge`)
			.set("Content-Type", "application/jwk+json");

		expect(response.status).to.eq(400);
		expect(response.body).to.deep.eq({
			error: 'unsupported "kty" (key type) parameter value',
		});
	});

	it("returns an error with and EC key", async () => {
		const { publicKey } = await generateKeyPair("ES256", { extractable: true });
		const response = await request(app)
			.post(`/key-auth/challenge`)
			.set("Content-Type", "application/jwk+json")
			.send(await exportJWK(publicKey));

		expect(response.status).to.eq(400);
		expect(response.body).to.deep.eq({
			error: 'invalid or unsupported jwk "alg" (algorithm) parameter value',
		});
	});

	it("returns a challenge with and RSA-OAEP-256 key", async () => {
		const { publicKey, privateKey } = await generateKeyPair("RSA-OAEP-256", {
			extractable: true,
		});
		const response = await request(app)
			.post(`/key-auth/challenge`)
			.set("Content-Type", "application/jwk+json")
			.send(await exportJWK(publicKey));

		expect(response.status).to.eq(200);
		assert(response.body.challenge);

		const {
			payload: { appToken },
		} = await jwtDecrypt(response.body.challenge, privateKey);

		assert(appToken);

		const secret = new TextEncoder().encode(protocols.config.secret_base);
		const {
			payload: { keyid },
		} = await jwtVerify(appToken as string, secret);

		expect(keyid).to.eq(await calculateJwkThumbprint(publicKey));
	});
});
