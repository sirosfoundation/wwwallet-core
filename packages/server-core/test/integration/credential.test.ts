import crypto from "node:crypto";
import { SDJwt } from "@sd-jwt/core";
import { digest as hasher } from "@sd-jwt/crypto-nodejs";
import { EncryptJWT, exportJWK, generateKeyPair, SignJWT } from "jose";
import request from "supertest";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { app, protocols } from "../support/app";

describe("credential endpoint", () => {
	it("returns an error without body", async () => {
		const response = await request(app).post("/credential");

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "credential requests require a body",
		});
	});

	it("returns an error with an empty body", async () => {
		const response = await request(app).post("/credential").send({});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description:
				"credential configuration ids are missing from body parameters",
		});
	});

	it("returns an error without proofs", async () => {
		const credential_configuration_id = "unknwown:configuration:id";
		const response = await request(app)
			.post("/credential")
			.send({ credential_configuration_id });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "proofs is missing from body parameters",
		});
	});

	it("returns an error without authorization header", async () => {
		const credential_configuration_id = "unknwown:configuration:id";
		const response = await request(app)
			.post("/credential")
			.send({ credential_configuration_id, proof: {} });

		expect(response.status).toBe(401);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "access token must be set",
		});
	});

	it("returns an error without authorization header", async () => {
		const credential_configuration_id = "unknwown:configuration:id";
		const response = await request(app)
			.post("/credential")
			.send({ credential_configuration_id, proofs: {} });

		expect(response.status).toBe(401);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "access token must be set",
		});
	});

	it("returns an error with an invalid access token", async () => {
		const credential_configuration_id = "unknwown:configuration:id";
		const response = await request(app)
			.post("/credential")
			.set("Authorization", "DPoP access_token")
			.send({ credential_configuration_id, proofs: {} });

		expect(response.status).toBe(401);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "access token is invalid",
		});
	});

	it("returns an error with an access token with an invalid type", async () => {
		const sub = "sub";
		const credential_configuration_id = "unknwown:configuration:id";

		const secret = new TextEncoder().encode(protocols.config.secret);
		const now = Date.now() / 1000;
		const access_token = await new EncryptJWT({ sub, token_type: "invalid" })
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.access_token_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/credential")
			.set("Authorization", `DPoP ${access_token}`)
			.send({ credential_configuration_id, proofs: {} });

		expect(response.status).toBe(401);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "access token is invalid",
		});
	});

	describe("with a valid access token", () => {
		const sub = "sub";
		const scope = "full:scope deferred:scope";
		let access_token: string;
		let c_nonce: string;
		beforeEach(async () => {
			const secret = new TextEncoder().encode(protocols.config.secret);
			const now = Date.now() / 1000;
			access_token = await new EncryptJWT({
				client_id: protocols.config.issuer_client?.id,
				sub,
				token_type: "access_token",
				scope,
			})
				.setProtectedHeader({
					alg: "dir",
					enc: protocols.config.token_encryption || "",
				})
				.setIssuedAt()
				.setExpirationTime(now + (protocols.config.access_token_ttl || 0))
				.encrypt(secret);

			c_nonce = await new EncryptJWT({
				token_type: "c_nonce",
				sub: protocols.config.issuer_client?.id,
			})
				.setProtectedHeader({
					alg: "dir",
					enc: protocols.config.token_encryption || "",
				})
				.setIssuedAt()
				.setExpirationTime(now + (protocols.config.access_token_ttl || 0))
				.encrypt(secret);
		});

		it("returns an error without dpop", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.send({ credential_configuration_id, proofs: {} });

			expect(response.status).toBe(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "request requires a dpop value",
			});
		});

		it("returns an error with more than one dpop header", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const dpop = "invalid jwt";
			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.set("DPoP", dpop)
				.set("DPoP", "other")
				.send({ credential_configuration_id, proofs: {} });

			expect(response.status).toBe(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "dpop jwt header is invalid",
			});
		});

		it("returns an error with an invalid dpop jwt", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const dpop = "invalid jwt";
			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.set("DPoP", dpop)
				.send({ credential_configuration_id, proofs: {} });

			expect(response.status).toBe(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "dpop jwt header is invalid",
			});
		});

		it("returns an error with an invalid dpop jwt header (typ)", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const dpop = await new SignJWT({})
				.setProtectedHeader({ alg: "HS256" })
				.sign(new TextEncoder().encode("secret"));

			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.set("DPoP", dpop)
				.send({ credential_configuration_id, proofs: {} });

			expect(response.status).toBe(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "dpop jwt typ header must have dpop+jwt value",
			});
		});

		it("returns an error with an invalid dpop jwt header (alg)", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const dpop = await new SignJWT({})
				.setProtectedHeader({ typ: "dpop+jwt", alg: "HS256" })
				.sign(new TextEncoder().encode("secret"));

			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.set("DPoP", dpop)
				.send({ credential_configuration_id, proofs: {} });

			expect(response.status).toBe(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "jwk is missing from dpop jwt header",
			});
		});

		it("returns an error with an invalid dpop jwt header (jwt signing key)", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const { publicKey } = await generateKeyPair("ES256");
			const dpop = await new SignJWT({})
				.setProtectedHeader({
					typ: "dpop+jwt",
					alg: "HS256",
					jwk: await exportJWK(publicKey),
				})
				.sign(new TextEncoder().encode("secret"));

			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.set("DPoP", dpop)
				.send({ credential_configuration_id, proofs: {} });

			expect(response.status).toBe(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "dpop jwt must be signed with an asymetric key",
			});
		});

		it("returns an error with an invalid dpop jwt signature", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const { publicKey: otherPublicKey } = await generateKeyPair("ES256");
			const { privateKey } = await generateKeyPair("ES256");
			const dpop = await new SignJWT({})
				.setProtectedHeader({
					typ: "dpop+jwt",
					alg: "ES256",
					jwk: await exportJWK(otherPublicKey),
				})
				.sign(privateKey);

			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.set("DPoP", dpop)
				.send({ credential_configuration_id, proofs: {} });

			expect(response.status).toBe(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "invalid dpop jwt",
			});
		});

		it("returns an error with an invalid dpop jwt payload", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const { publicKey, privateKey } = await generateKeyPair("ES256");
			const claims = {};
			const dpop = await new SignJWT(claims)
				.setProtectedHeader({
					typ: "dpop+jwt",
					alg: "ES256",
					jwk: await exportJWK(publicKey),
				})
				.sign(privateKey);

			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.set("DPoP", dpop)
				.send({ credential_configuration_id, proofs: {} });

			expect(response.status).toBe(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "jti claim is missing in dpop jwt payload",
			});
		});

		it("returns an error with an invalid dpop htm value", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const { publicKey, privateKey } = await generateKeyPair("ES256");
			const claims = {
				jti: "jti",
				htm: "htm",
				htu: "htu",
				iat: Math.floor(Date.now() / 1000),
				ath: "ath",
			};
			const dpop = await new SignJWT(claims)
				.setProtectedHeader({
					typ: "dpop+jwt",
					alg: "ES256",
					jwk: await exportJWK(publicKey),
				})
				.sign(privateKey);

			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.set("DPoP", dpop)
				.send({ credential_configuration_id, proofs: {} });

			expect(response.status).toBe(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "invalid dpop htm value",
			});
		});

		it("returns an error with an invalid dpop htu value", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const { publicKey, privateKey } = await generateKeyPair("ES256");
			const claims = {
				jti: "jti",
				htm: "POST",
				htu: "htu",
				iat: Math.floor(Date.now() / 1000),
				ath: "ath",
			};
			const dpop = await new SignJWT(claims)
				.setProtectedHeader({
					typ: "dpop+jwt",
					alg: "ES256",
					jwk: await exportJWK(publicKey),
				})
				.sign(privateKey);

			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.set("DPoP", dpop)
				.send({ credential_configuration_id, proofs: {} });

			expect(response.status).toBe(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "invalid dpop htu value",
			});
		});

		it("returns an error with an invalid dpop htu value (query params)", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const { publicKey, privateKey } = await generateKeyPair("ES256");
			const claims = {
				jti: "jti",
				htm: "POST",
				htu: "http://localhost:5000/credential",
				iat: Math.floor(Date.now() / 1000),
				ath: "ath",
			};
			const dpop = await new SignJWT(claims)
				.setProtectedHeader({
					typ: "dpop+jwt",
					alg: "ES256",
					jwk: await exportJWK(publicKey),
				})
				.sign(privateKey);

			const response = await request(app)
				.post("/credential?test=true")
				.set("Authorization", `DPoP ${access_token}`)
				.set("DPoP", dpop)
				.send({ credential_configuration_id, proofs: {} });

			expect(response.status).toBe(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "invalid dpop htu value",
			});
		});

		it("returns an error with an invalid dpop ath value", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const { publicKey, privateKey } = await generateKeyPair("ES256");
			const claims = {
				jti: "jti",
				htm: "POST",
				htu: "http://localhost:5000/credential",
				iat: Math.floor(Date.now() / 1000),
				ath: "ath",
			};
			const dpop = await new SignJWT(claims)
				.setProtectedHeader({
					typ: "dpop+jwt",
					alg: "ES256",
					jwk: await exportJWK(publicKey),
				})
				.sign(privateKey);

			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.set("DPoP", dpop)
				.send({ credential_configuration_id, proofs: {} });

			expect(response.status).toBe(400);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "invalid dpop ath value",
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
					htm: "POST",
					htu: "http://localhost:5000/credential",
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

			it("returns an error with no proof", async () => {
				const credential_configuration_id = "full";
				const response = await request(app)
					.post("/credential")
					.set("Authorization", `DPoP ${access_token}`)
					.set("DPoP", dpop)
					.send({ credential_configuration_id, proofs: {} });

				expect(response.status).toBe(400);
				expect(response.body).to.deep.eq({
					error: "invalid_request",
					error_description: "holder ownership proof is required",
				});
			});

			it("returns empty credential list with unknown credential configuration id", async () => {
				const credential_configuration_id = "unknwown:configuration:id";
				const { publicKey, privateKey } = await generateKeyPair("ES256");
				const jwk = await exportJWK(publicKey);
				const proof = await new SignJWT({ nonce: c_nonce })
					.setProtectedHeader({ alg: "ES256", jwk })
					.sign(privateKey);
				const response = await request(app)
					.post("/credential")
					.set("Authorization", `DPoP ${access_token}`)
					.set("DPoP", dpop)
					.send({ credential_configuration_id, proofs: { jwt: [proof] } });

				expect(response.status).toBe(200);
				expect(response.body).to.deep.eq({
					credentials: [],
				});
			});

			it("returns empty credential list with unknown credential configuration ids", async () => {
				const credential_configuration_ids = ["unknwown:configuration:id"];
				const { publicKey, privateKey } = await generateKeyPair("ES256");
				const jwk = await exportJWK(publicKey);
				const proof = await new SignJWT({ nonce: c_nonce })
					.setProtectedHeader({ alg: "ES256", jwk })
					.sign(privateKey);
				const response = await request(app)
					.post("/credential")
					.set("Authorization", `DPoP ${access_token}`)
					.set("DPoP", dpop)
					.send({ credential_configuration_ids, proofs: { jwt: [proof] } });

				expect(response.status).toBe(200);
				expect(response.body).to.deep.eq({
					credentials: [],
				});
			});

			it("returns credentials with DPoP token type", async () => {
				const credential_configuration_id = "full";
				const { publicKey, privateKey } = await generateKeyPair("ES256");
				const jwk = await exportJWK(publicKey);
				const proof = await new SignJWT({ nonce: c_nonce })
					.setProtectedHeader({ alg: "ES256", jwk })
					.sign(privateKey);
				const response = await request(app)
					.post("/credential")
					.set("Authorization", `DPoP ${access_token}`)
					.set("DPoP", dpop)
					.send({ credential_configuration_id, proofs: { jwt: [proof] } });

				expect(response.status).toBe(200);
				assert(response.body.credentials[0].credential);

				const credential = response.body.credentials[0].credential;
				const sdjwt = await SDJwt.fromEncode(credential, hasher);
				const claims = await sdjwt.getClaims(hasher);
				expect(claims).to.deep.eq({
					iss: "http://localhost:5000",
					sub: "sub",
					vct: "urn:test:full",
					cnf: { jwk },
				});
			});

			it("returns credentials with bearer token type", async () => {
				const credential_configuration_id = "full";
				const { publicKey, privateKey } = await generateKeyPair("ES256");
				const jwk = await exportJWK(publicKey);
				const proof = await new SignJWT({ nonce: c_nonce })
					.setProtectedHeader({ alg: "ES256", jwk })
					.sign(privateKey);
				const response = await request(app)
					.post("/credential")
					.set("Authorization", `bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({ credential_configuration_id, proofs: { jwt: [proof] } });

				expect(response.status).toBe(200);
				assert(response.body.credentials[0].credential);

				const credential = response.body.credentials[0].credential;
				const sdjwt = await SDJwt.fromEncode(credential, hasher);
				const claims = await sdjwt.getClaims(hasher);
				expect(claims).to.deep.eq({
					iss: "http://localhost:5000",
					sub: "sub",
					vct: "urn:test:full",
					cnf: { jwk },
				});
			});

			it("returns credentials with Bearer token type", async () => {
				const credential_configuration_id = "full";
				const { publicKey, privateKey } = await generateKeyPair("ES256");
				const jwk = await exportJWK(publicKey);
				const proof = await new SignJWT({ nonce: c_nonce })
					.setProtectedHeader({ alg: "ES256", jwk })
					.sign(privateKey);
				const response = await request(app)
					.post("/credential")
					.set("Authorization", `Bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({ credential_configuration_id, proofs: { jwt: [proof] } });

				expect(response.status).toBe(200);
				assert(response.body.credentials[0].credential);

				const credential = response.body.credentials[0].credential;
				const sdjwt = await SDJwt.fromEncode(credential, hasher);
				const claims = await sdjwt.getClaims(hasher);
				expect(claims).to.deep.eq({
					iss: "http://localhost:5000",
					sub: "sub",
					vct: "urn:test:full",
					cnf: { jwk },
				});
			});

			it("returns credentials with proofs", async () => {
				const credential_configuration_id = "full";
				const { publicKey, privateKey } = await generateKeyPair("ES256");
				const jwk = await exportJWK(publicKey);
				const proof = await new SignJWT({ nonce: c_nonce })
					.setProtectedHeader({ alg: "ES256", jwk })
					.sign(privateKey);
				const response = await request(app)
					.post("/credential")
					.set("Authorization", `Bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({ credential_configuration_id, proofs: { jwt: [proof] } });

				expect(response.status).toBe(200);
				assert(response.body.credentials[0].credential);

				const credential = response.body.credentials[0].credential;
				const sdjwt = await SDJwt.fromEncode(credential, hasher);
				const claims = await sdjwt.getClaims(hasher);
				expect(claims).to.deep.eq({
					iss: "http://localhost:5000",
					sub: "sub",
					vct: "urn:test:full",
					cnf: { jwk },
				});
			});

			it("returns credentials with a proof", async () => {
				const credential_configuration_id = "full";
				const { publicKey, privateKey } = await generateKeyPair("ES256");
				const jwk = await exportJWK(publicKey);
				const proof = await new SignJWT({ nonce: c_nonce })
					.setProtectedHeader({ alg: "ES256", jwk })
					.sign(privateKey);
				const response = await request(app)
					.post("/credential")
					.set("Authorization", `Bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({ credential_configuration_id, proof: { jwt: proof } });

				expect(response.status).toBe(200);
				assert(response.body.credentials[0].credential);

				const credential = response.body.credentials[0].credential;
				const sdjwt = await SDJwt.fromEncode(credential, hasher);
				const claims = await sdjwt.getClaims(hasher);
				expect(claims).to.deep.eq({
					iss: "http://localhost:5000",
					sub: "sub",
					vct: "urn:test:full",
					cnf: { jwk },
				});
			});

			it("returns deferred credentials", async () => {
				const credential_configuration_id = "deferred";
				const { publicKey, privateKey } = await generateKeyPair("ES256");
				const jwk = await exportJWK(publicKey);
				const proof = await new SignJWT({ nonce: c_nonce })
					.setProtectedHeader({ alg: "ES256", jwk })
					.sign(privateKey);
				const response = await request(app)
					.post("/credential")
					.set("Authorization", `Bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({ credential_configuration_id, proof: { jwt: proof } });

				expect(response.status).toBe(200);
				expect(response.body).to.deep.eq({
					transaction_id: "transaction_id",
					interval: 3600,
				});
			});
		});
	});

	describe("with an unprelivegied access token (scope)", () => {
		const client_id = "id";
		const sub = "sub";
		let access_token: string;
		beforeEach(async () => {
			const secret = new TextEncoder().encode(protocols.config.secret);
			const now = Date.now() / 1000;
			access_token = await new EncryptJWT({
				client_id,
				sub,
				token_type: "access_token",
			})
				.setProtectedHeader({
					alg: "dir",
					enc: protocols.config.token_encryption || "",
				})
				.setIssuedAt()
				.setExpirationTime(now + (protocols.config.access_token_ttl || 0))
				.encrypt(secret);
		});

		describe("with a valid dpop header", () => {
			let dpop: string;
			let proof: string;
			beforeEach(async () => {
				const secret = new TextEncoder().encode(core.config.secret);
				const now = Date.now() / 1000;
				const { publicKey, privateKey } = await generateKeyPair("ES256");
				const ath = crypto
					.createHash("sha256")
					.update(access_token)
					.digest("base64url");
				const claims = {
					jti: "jti",
					htm: "POST",
					htu: "http://localhost:5000/credential",
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
				const c_nonce = await new EncryptJWT({
					token_type: "c_nonce",
					sub: core.config.issuer_client?.id,
				})
					.setProtectedHeader({
						alg: "dir",
						enc: core.config.token_encryption || "",
					})
					.setIssuedAt()
					.setExpirationTime(now + (core.config.access_token_ttl || 0))
					.encrypt(secret);
				const jwk = await exportJWK(publicKey);
				proof = await new SignJWT({ nonce: c_nonce })
					.setProtectedHeader({ alg: "ES256", jwk })
					.sign(privateKey);
			});

			it("returns an empty credential list", async () => {
				const credential_configuration_id = "full";
				const response = await request(app)
					.post("/credential")
					.set("Authorization", `Bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({ credential_configuration_id, proofs: { jwt: [proof] } });

				expect(response.status).toBe(200);
				expect(response.body).to.deep.eq({
					credentials: [],
				});
			});
		});
	});

	describe("with an unprelivegied access token (client)", () => {
		const client_id = "other";
		const scope = "full:scope";
		const sub = "sub";
		let access_token: string;
		beforeEach(async () => {
			const secret = new TextEncoder().encode(protocols.config.secret);
			const now = Date.now() / 1000;
			access_token = await new EncryptJWT({
				client_id,
				sub,
				token_type: "access_token",
				scope,
			})
				.setProtectedHeader({
					alg: "dir",
					enc: protocols.config.token_encryption || "",
				})
				.setIssuedAt()
				.setExpirationTime(now + (protocols.config.access_token_ttl || 0))
				.encrypt(secret);
		});

		describe("with a valid proof, dpop header", () => {
			let dpop: string;
			let proof: string;
			beforeEach(async () => {
				const secret = new TextEncoder().encode(core.config.secret);
				const now = Date.now() / 1000;
				const { publicKey, privateKey } = await generateKeyPair("ES256");
				const ath = crypto
					.createHash("sha256")
					.update(access_token)
					.digest("base64url");
				const claims = {
					jti: "jti",
					htm: "POST",
					htu: "http://localhost:5000/credential",
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
				const c_nonce = await new EncryptJWT({
					token_type: "c_nonce",
					sub: core.config.issuer_client?.id,
				})
					.setProtectedHeader({
						alg: "dir",
						enc: core.config.token_encryption || "",
					})
					.setIssuedAt()
					.setExpirationTime(now + (core.config.access_token_ttl || 0))
					.encrypt(secret);
				const jwk = await exportJWK(publicKey);
				proof = await new SignJWT({ nonce: c_nonce })
					.setProtectedHeader({ alg: "ES256", jwk })
					.sign(privateKey);
			});

			it("returns an empty credential list", async () => {
				const credential_configuration_id = "full";
				const response = await request(app)
					.post("/credential")
					.set("Authorization", `Bearer ${access_token}`)
					.set("DPoP", dpop)
					.send({ credential_configuration_id, proofs: { jwt: [proof] } });

				expect(response.status).toBe(200);
				expect(response.body).to.deep.eq({
					credentials: [],
				});
			});
		});
	});
});
