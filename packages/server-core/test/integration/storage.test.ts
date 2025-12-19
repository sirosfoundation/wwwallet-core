import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
	calculateJwkThumbprint,
	EncryptJWT,
	exportJWK,
	generateKeyPair,
	generateSecret,
	jwtDecrypt,
	jwtVerify,
	type KeyObject,
	SignJWT,
} from "jose";
import request from "supertest";
import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import { app, storage } from "../support/app";

describe("storage - retrieving events", () => {
	afterEach(() => {
		const stores = fs.readdirSync(storage.config.events_path || "");
		for (const store of stores) {
			if (store === ".keep") continue;
			fs.rmSync(path.join(storage.config.events_path || "", store), {
				recursive: true,
			});
		}
	});

	it("returns unauthorized", async () => {
		const response = await request(app).get(`/event-store/events`);

		expect(response.status).to.eq(401);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "access token must be set",
		});
	});

	describe("with a valid bearer", () => {
		let accessTokenPublicKey: KeyObject;
		let access_token: string;
		beforeEach(async () => {
			const now = Date.now() / 1000;
			const { publicKey } = await generateKeyPair("ECDH-ES");
			const secret = new TextEncoder().encode(storage.config.secret_base);
			accessTokenPublicKey = publicKey;
			access_token = await new SignJWT({
				keyid: await calculateJwkThumbprint(await exportJWK(publicKey)),
			})
				.setExpirationTime(now + 10)
				.setProtectedHeader({ alg: "HS256" })
				.sign(secret);
		});

		it("returns an error", async () => {
			const response = await request(app)
				.get(`/event-store/events`)
				.set("Authorization", `Bearer ${access_token}`);

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "request requires a dpop value",
			});
		});

		describe("with a valid dpop header", () => {
			let dpop: string;
			beforeEach(async () => {
				const { publicKey, privateKey } = await generateKeyPair("ES256");
				const ath = crypto
					.createHash("sha256")
					.update(access_token)
					.digest("base64url");
				const claims = {
					jti: "jti",
					htm: "GET",
					htu: "http://localhost:5000/event-store/events",
					iat: Math.floor(Date.now() / 1000),
					ath,
				};
				dpop = await new SignJWT(claims)
					.setProtectedHeader({
						typ: "dpop+jwt",
						alg: "ES256",
						jwk: await exportJWK(publicKey),
					})
					.sign(privateKey);
			});

			it("returns empty event list", async () => {
				const response = await request(app)
					.get(`/event-store/events`)
					.set("DPoP", dpop)
					.set("Authorization", `Bearer ${access_token}`);

				expect(response.status).to.eq(200);
				expect(response.body).to.deep.eq({
					events: [],
				});
			});

			it("returns empty event list with a valid keyid", async () => {
				const response = await request(app)
					.get(`/event-store/events`)
					.set("DPoP", dpop)
					.set("Authorization", `Bearer ${access_token}`);

				expect(response.status).to.eq(200);
				expect(response.body).to.deep.eq({
					events: [],
				});
			});

			it("returns an event list with events stored", async () => {
				const keyid = await calculateJwkThumbprint(accessTokenPublicKey);
				const eventHash = "a";
				const event = "event";
				const encryption_key = {};
				const addressing_record = await new SignJWT({
					hash: eventHash,
					encryption_key,
				})
					.setProtectedHeader({ alg: "HS256" })
					.sign(new TextEncoder().encode("secret"));
				const eventTableName = crypto
					.createHash("sha256")
					.update(keyid)
					.digest("base64url");
				fs.writeFileSync(
					path.join(storage.config.events_path || "", eventHash),
					event,
				);
				fs.appendFileSync(
					path.join(
						storage.config.events_path || "",
						`${eventTableName}.table`,
					),
					addressing_record,
				);
				const response = await request(app)
					.get(`/event-store/events`)
					.set("DPoP", dpop)
					.set("Authorization", `Bearer ${access_token}`);

				expect(response.status).to.eq(200);
				expect(response.body).to.deep.eq({
					events: [
						{
							hash: eventHash,
							encryption_key,
							payload: event,
						},
					],
				});
			});
		});
	});
});

describe("storage - store events", () => {
	afterEach(() => {
		const stores = fs.readdirSync(storage.config.events_path || "");
		for (const store of stores) {
			if (store === ".keep") continue;
			fs.rmSync(path.join(storage.config.events_path || "", store), {
				recursive: true,
			});
		}
	});

	it("returns an error", async () => {
		const eventHash = "a";
		const response = await request(app).put(`/event-store/events/${eventHash}`);

		expect(response.status).to.eq(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "store event requests require a body",
		});
	});

	describe("with a valid bearer", () => {
		let accessTokenPublicKey: KeyObject;
		let access_token: string;
		beforeEach(async () => {
			const now = Date.now() / 1000;
			const { publicKey } = await generateKeyPair("ECDH-ES");
			const secret = new TextEncoder().encode(storage.config.secret_base);
			accessTokenPublicKey = publicKey;
			access_token = await new SignJWT({
				keyid: await calculateJwkThumbprint(await exportJWK(publicKey)),
			})
				.setExpirationTime(now + 10)
				.setProtectedHeader({ alg: "HS256" })
				.sign(secret);
		});

		it("returns an error with an empty body", async () => {
			const eventHash = "a";
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Authorization", `Bearer ${access_token}`)
				.send({});

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "addressing table parameter is required",
			});
		});

		it("returns an error with an addressing table (null)", async () => {
			const eventHash = "a";
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Authorization", `Bearer ${access_token}`)
				.send({ addressing_table: [null] });

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "#/addressing_table/0 must be a valid jwt",
			});
		});

		it("returns an error with an addressing table (invalid jwt)", async () => {
			const eventHash = "a";
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Authorization", `Bearer ${access_token}`)
				.send({ addressing_table: ["invalid jwt"] });

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "#/addressing_table/0 must be a valid jwt",
			});
		});

		it("returns an error with an addressing table (hash)", async () => {
			const eventHash = "a";
			const addressing_record = await new SignJWT({ hash: eventHash })
				.setProtectedHeader({ alg: "HS256" })
				.sign(new TextEncoder().encode("secret"));
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Authorization", `Bearer ${access_token}`)
				.send({ addressing_table: [addressing_record] });

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description:
					"encryption key parameter is is missing at #/addressing_table/0",
			});
		});

		it("returns an error with an addressing table (encryption key)", async () => {
			const eventHash = "a";
			const addressing_record = await new SignJWT({
				hash: eventHash,
				encryption_key: {},
			})
				.setProtectedHeader({ alg: "HS256" })
				.sign(new TextEncoder().encode("secret"));
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Authorization", `Bearer ${access_token}`)
				.send({ addressing_table: [addressing_record] });

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "events parameter is required",
			});
		});

		it("returns an error with an event (null)", async () => {
			const eventHash = "a";
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Authorization", `Bearer ${access_token}`)
				.send({ addressing_table: [], events: null });

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "events parameter is required",
			});
		});

		it("returns an error with events (empty object)", async () => {
			const eventHash = "a";
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Authorization", `Bearer ${access_token}`)
				.send({ addressing_table: [], events: [{}] });

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "hash parameter is is missing at #/events/0",
			});
		});

		it("returns an error with events (hash)", async () => {
			const eventHash = "a";
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Authorization", `Bearer ${access_token}`)
				.send({ addressing_table: [], events: [{ hash: eventHash }] });

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "payload parameter is is missing at #/events/0",
			});
		});

		it("returns an error with events (payload)", async () => {
			const eventHash = "a";
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Authorization", `Bearer ${access_token}`)
				.send({
					addressing_table: [],
					events: [{ hash: eventHash, payload: "payload" }],
				});

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "invalid token or protected header formatting",
			});
		});

		it("returns an error with events (jwe payload)", async () => {
			const eventHash = "a";
			const { publicKey } = await generateKeyPair("ECDH-ES");
			const event = await new EncryptJWT({})
				.setProtectedHeader({ alg: "ECDH-ES", enc: "A256CBC-HS512" })
				.encrypt(publicKey);
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Authorization", `Bearer ${access_token}`)
				.send({
					addressing_table: [],
					events: [{ hash: eventHash, payload: event }],
				});

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "request requires a dpop value",
			});
		});

		it("returns an error with empty addressing table and events", async () => {
			const eventHash = "a";
			const response = await request(app)
				.put(`/event-store/events/${eventHash}`)
				.set("Authorization", `Bearer ${access_token}`)
				.send({ addressing_table: [], events: [] });

			expect(response.status).to.eq(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "request requires a dpop value",
			});
		});

		describe("with a valid dpop header", () => {
			const eventHash = "a";
			let dpop: string;
			beforeEach(async () => {
				const { publicKey, privateKey } = await generateKeyPair("ES256");
				const ath = crypto
					.createHash("sha256")
					.update(access_token)
					.digest("base64url");
				const claims = {
					jti: "jti",
					htm: "PUT",
					htu: `http://localhost:5000/event-store/events/${eventHash}`,
					iat: Math.floor(Date.now() / 1000),
					ath,
				};
				dpop = await new SignJWT(claims)
					.setProtectedHeader({
						typ: "dpop+jwt",
						alg: "ES256",
						jwk: await exportJWK(publicKey),
					})
					.sign(privateKey);
			});

			it("returns an error with empty addressing table", async () => {
				const { publicKey } = await generateKeyPair("ECDH-ES");
				const event = await new EncryptJWT({})
					.setProtectedHeader({ alg: "ECDH-ES", enc: "A256CBC-HS512" })
					.encrypt(publicKey);
				const response = await request(app)
					.put(`/event-store/events/${eventHash}`)
					.set("Authorization", `Bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({
						addressing_table: [],
						events: [{ hash: eventHash, payload: event }],
					});

				expect(response.status).to.eq(400);
				expect(response.body).to.deep.eq({
					error: "invalid_request",
					error_description: "some events are not present in addressing table",
				});
			});

			it("returns an error with empty addressing table", async () => {
				const addressing_record = await new SignJWT({
					hash: eventHash,
					encryption_key: {},
				})
					.setProtectedHeader({ alg: "HS256" })
					.sign(new TextEncoder().encode("secret"));
				const response = await request(app)
					.put(`/event-store/events/${eventHash}`)
					.set("Authorization", `Bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({
						addressing_table: [addressing_record],
						events: [],
					});

				expect(response.status).to.eq(400);
				expect(response.body).to.deep.eq({
					error: "invalid_request",
					error_description: "addressing table reference unknown events",
				});
			});

			it("returns an error with invalid addressing", async () => {
				const addressing_record = await new SignJWT({
					hash: "invalid",
					encryption_key: {},
				})
					.setProtectedHeader({ alg: "HS256" })
					.sign(new TextEncoder().encode("secret"));
				const { publicKey } = await generateKeyPair("ECDH-ES");
				const event = await new EncryptJWT({})
					.setProtectedHeader({ alg: "ECDH-ES", enc: "A256CBC-HS512" })
					.encrypt(publicKey);
				const response = await request(app)
					.put(`/event-store/events/${eventHash}`)
					.set("Authorization", `Bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({
						addressing_table: [addressing_record],
						events: [{ hash: eventHash, payload: event }],
					});

				expect(response.status).to.eq(400);
				expect(response.body).to.deep.eq({
					error: "invalid_request",
					error_description: "addressing table reference unknown events",
				});
			});

			it("returns an error with not addressed events", async () => {
				const addressing_record = await new SignJWT({
					hash: eventHash,
					encryption_key: {},
				})
					.setProtectedHeader({ alg: "HS256" })
					.sign(new TextEncoder().encode("secret"));
				const { publicKey } = await generateKeyPair("ECDH-ES");
				const event = await new EncryptJWT({})
					.setProtectedHeader({ alg: "ECDH-ES", enc: "A256CBC-HS512" })
					.encrypt(publicKey);
				const response = await request(app)
					.put(`/event-store/events/${eventHash}`)
					.set("Authorization", `Bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({
						addressing_table: [addressing_record],
						events: [
							{ hash: eventHash, payload: event },
							{ hash: "b", payload: event },
						],
					});

				expect(response.status).to.eq(400);
				expect(response.body).to.deep.eq({
					error: "invalid_request",
					error_description: "some events are not present in addressing table",
				});
			});

			it("stores an event with jwe body", async () => {
				const { publicKey } = await generateKeyPair("ECDH-ES");
				const event = await new EncryptJWT({})
					.setProtectedHeader({ alg: "ECDH-ES", enc: "A256CBC-HS512" })
					.encrypt(publicKey);
				const addressing_record = await new SignJWT({
					hash: eventHash,
					encryption_key: {},
				})
					.setProtectedHeader({ alg: "HS256" })
					.sign(new TextEncoder().encode("secret"));
				const response = await request(app)
					.put(`/event-store/events/${eventHash}`)
					.set("Authorization", `Bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({
						addressing_table: [addressing_record],
						events: [{ hash: eventHash, payload: event }],
					});

				expect(response.status).to.eq(200);
				expect(response.body).to.deep.eq({
					events: [
						{
							hash: eventHash,
							payload: event,
						},
					],
				});

				const eventTableName = crypto
					.createHash("sha256")
					.update(await calculateJwkThumbprint(accessTokenPublicKey))
					.digest("base64url");
				const storedEvent = fs.readFileSync(
					path.join(storage.config.events_path || "", eventHash),
				);
				expect(storedEvent.toString()).to.eq(event);
				const storedTable = fs.readFileSync(
					path.join(
						storage.config.events_path || "",
						`${eventTableName}.table`,
					),
				);
				expect(storedTable.toString()).to.eq(`${addressing_record}\n`);
			});

			it("return an error with already existing event", async () => {
				fs.writeFileSync(
					path.join(storage.config.events_path || "", eventHash),
					"existing",
				);

				const { publicKey } = await generateKeyPair("ECDH-ES");
				const event = await new EncryptJWT({})
					.setProtectedHeader({ alg: "ECDH-ES", enc: "A256CBC-HS512" })
					.encrypt(publicKey);
				const addressing_record = await new SignJWT({
					hash: eventHash,
					encryption_key: {},
				})
					.setProtectedHeader({ alg: "HS256" })
					.sign(new TextEncoder().encode("secret"));

				const response = await request(app)
					.put(`/event-store/events/${eventHash}`)
					.set("Authorization", `Bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({
						addressing_table: [addressing_record],
						events: [{ hash: eventHash, payload: event }],
					});

				expect(response.status).to.eq(400);
				expect(response.body).to.deep.eq({
					error: "invalid_request",
					error_description: "#/events/0/hash already exists",
				});
			});
		});
	});
});

describe("storage - authentication", () => {
	it("returns an error", async () => {
		const response = await request(app).post(`/key-auth/challenge`);

		expect(response.status).to.eq(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "application/jwk+json body is required",
		});
	});

	it("returns an error with an empty body", async () => {
		const response = await request(app)
			.post(`/key-auth/challenge`)
			.set("Content-Type", "application/jwk+json");

		expect(response.status).to.eq(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: 'unsupported "kty" (key type) parameter value',
		});
	});

	it("returns an error with and RSA key", async () => {
		const { publicKey } = await generateKeyPair("RSA-OAEP-256", {
			extractable: true,
		});
		const response = await request(app)
			.post(`/key-auth/challenge`)
			.set("Content-Type", "application/jwk+json")
			.send(await exportJWK(publicKey));

		expect(response.status).to.eq(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description:
				'invalid or unsupported jwk "alg" (algorithm) parameter value',
		});
	});

	it("returns a challenge with and ECDH-ES key", async () => {
		const { publicKey, privateKey } = await generateKeyPair("ECDH-ES", {
			extractable: true,
		});
		const response = await request(app)
			.post(`/key-auth/challenge`)
			.set("Content-Type", "application/jwk+json")
			.send(await exportJWK(publicKey));

		expect(response.status).to.eq(200);
		assert(response.body.challenge);

		const {
			payload: { access_token },
		} = await jwtDecrypt(response.body.challenge, privateKey);

		assert(access_token);

		const secret = new TextEncoder().encode(storage.config.secret_base);
		const {
			payload: { keyid },
		} = await jwtVerify(access_token as string, secret);

		expect(keyid).to.eq(await calculateJwkThumbprint(publicKey));
	});
});

describe("storage", () => {
	afterEach(() => {
		const stores = fs.readdirSync(storage.config.events_path || "");
		for (const store of stores) {
			if (store === ".keep") continue;
			fs.rmSync(path.join(storage.config.events_path || "", store), {
				recursive: true,
			});
		}
	});

	it("performs the flow", async () => {
		// --- Authentication
		const {
			publicKey: accessTokenPublicKey,
			privateKey: accessTokenPrivateKey,
		} = await generateKeyPair("ECDH-ES", {
			extractable: true,
		});
		const authentication = await request(app)
			.post(`/key-auth/challenge`)
			.set("Content-Type", "application/jwk+json")
			.send(await exportJWK(accessTokenPublicKey));

		expect(authentication.status).to.eq(200);
		assert(authentication.body.challenge);

		const {
			payload: { access_token: authenticatedAccessToken },
		} = await jwtDecrypt<{ access_token: string }>(
			authentication.body.challenge,
			accessTokenPrivateKey,
		);

		assert(authenticatedAccessToken);

		// --- Store an event
		const eventHash = "a";
		const { publicKey: dpopPublicKey, privateKey: dpopPrivateKey } =
			await generateKeyPair("ES256");
		const storeDpop = await new SignJWT({
			jti: "jti",
			htm: "PUT",
			htu: `http://localhost:5000/event-store/events/${eventHash}`,
			iat: Math.floor(Date.now() / 1000),
			ath: crypto
				.createHash("sha256")
				.update(authenticatedAccessToken)
				.digest("base64url"),
		})
			.setProtectedHeader({
				typ: "dpop+jwt",
				alg: "ES256",
				jwk: await exportJWK(dpopPublicKey),
			})
			.sign(dpopPrivateKey);

		const encryption_key = await generateSecret("A256GCMKW", {
			extractable: true,
		});
		const event = await new EncryptJWT({})
			.setProtectedHeader({ alg: "A256GCMKW", enc: "A256CBC-HS512" })
			.encrypt(encryption_key);
		const addressing_record = await new SignJWT({
			hash: eventHash,
			encryption_key: await exportJWK(encryption_key),
		})
			.setProtectedHeader({ alg: "HS256" })
			.sign(new TextEncoder().encode("secret"));

		const store = await request(app)
			.put(`/event-store/events/${eventHash}`)
			.set("Authorization", `Bearer ${authenticatedAccessToken}`)
			.set("DPoP", storeDpop)
			.send({
				addressing_table: [addressing_record],
				events: [{ hash: eventHash, payload: event }],
			});

		expect(store.status).to.eq(200);
		expect(store.body).to.deep.eq({
			events: [
				{
					hash: eventHash,
					payload: event,
				},
			],
		});

		// --- Retrieve an event
		const retrieveDpop = await new SignJWT({
			jti: "jti",
			htm: "GET",
			htu: `http://localhost:5000/event-store/events`,
			iat: Math.floor(Date.now() / 1000),
			ath: crypto
				.createHash("sha256")
				.update(authenticatedAccessToken)
				.digest("base64url"),
		})
			.setProtectedHeader({
				typ: "dpop+jwt",
				alg: "ES256",
				jwk: await exportJWK(dpopPublicKey),
			})
			.sign(dpopPrivateKey);
		const response = await request(app)
			.get(`/event-store/events`)
			.set("DPoP", retrieveDpop)
			.set("Authorization", `Bearer ${authenticatedAccessToken}`);

		expect(response.status).to.eq(200);
		expect(response.body).to.deep.eq({
			events: [
				{
					hash: eventHash,
					encryption_key: await exportJWK(encryption_key),
					payload: event,
				},
			],
		});
	});
});
