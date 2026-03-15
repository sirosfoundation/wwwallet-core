import crypto from "node:crypto";
import { EncryptJWT, jwtDecrypt, SignJWT } from "jose";
import request from "supertest";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { AUTHORIZATION_REQUEST_URI_PREFIX } from "../../src/constants";
import { app, protocols, trustedPem } from "../support/app";

describe("authorization code - authorize", () => {
	let issuer_state: string;
	beforeEach(async () => {
		const now = Date.now() / 1000;

		const secret = new TextEncoder().encode(protocols.config.secret);

		issuer_state = await new EncryptJWT({
			sub: protocols.config.issuer_client?.id,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);
	});

	it("returns an error", async () => {
		const response = await request(app).get("/authorize");

		expect(response.status).toBe(400);
		expect(response.text).toMatch(
			"client id is missing from request parameters",
		);
	});

	it.skip("returns an error with invalid scope");

	it.skip("returns an error with invalid issuer_state");

	it("returns with a valid request uri", async () => {
		const response_type = "code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const scope = "client:scope";
		const code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
		const code_challenge_method = "S256";

		const {
			body: { request_uri },
		} = await request(app).post("/pushed-authorization-request").send({
			response_type,
			client_id,
			redirect_uri,
			scope,
			issuer_state,
			code_challenge,
			code_challenge_method,
		});

		const response = await request(app)
			.get("/authorize")
			.query({ client_id, request_uri });

		expect(response.status).toBe(200);
		expect(response.text).toMatch(request_uri);
	});

	it("rejects request_uri when redirect_uri is not registered for client", async () => {
		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const client_id = "id";
		const request_token = await new EncryptJWT({
			token_type: "authorization_request",
			response_type: "code",
			client_id,
			redirect_uri: "http://invalid.uri",
			scope: "client:scope",
			issuer_state,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(
				now + (protocols.config.pushed_authorization_request_ttl || 0),
			)
			.encrypt(secret);
		const request_uri = `${AUTHORIZATION_REQUEST_URI_PREFIX}${request_token}`;

		const response = await request(app)
			.get("/authorize")
			.query({ client_id, request_uri });

		expect(response.status).toBe(401);
		expect(response.text).toMatch("invalid client credentials");
	});
});

describe("authorization code - authenticate", () => {
	let issuer_state: string;
	beforeEach(async () => {
		const now = Date.now() / 1000;

		const secret = new TextEncoder().encode(protocols.config.secret);

		issuer_state = await new EncryptJWT({
			sub: protocols.config.issuer_client?.id,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);
	});

	describe("user credentials are valid", () => {
		const username = "wwwallet";
		const password = "tellawww";

		it("returns an error", async () => {
			const response = await request(app)
				.post("/authorize")
				.send({ username, password });

			expect(response.status).toBe(400);
			expect(response.text).toMatch(
				"client id is missing from request parameters",
			);
		});

		it("returns an error with client id", async () => {
			const client_id = "id";
			const response = await request(app)
				.post("/authorize")
				.send({ username, password })
				.query({ client_id });

			expect(response.status).toBe(400);
			expect(response.text).toMatch(
				"request uri is missing from request parameters",
			);
		});

		it("returns an error with invalid request uri", async () => {
			const client_id = "id";
			const request_uri = "urn:wwwallet:authorization_request:invalid";
			const response = await request(app)
				.post("/authorize")
				.send({ username, password })
				.query({ client_id, request_uri });

			expect(response.status).toBe(400);
			expect(response.text).toMatch("authorization request is invalid");
		});

		it.skip("returns an error with invalid scope");

		it.skip("returns an error with invalid issuer state");

		it("returns a code with a valid request uri", async () => {
			const response_type = "code";
			const client_id = "id";
			const redirect_uri = "http://redirect.uri";
			const scope = "client:scope";
			const state = "state";
			const code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
			const code_challenge_method = "S256";

			const {
				body: { request_uri },
			} = await request(app).post("/pushed-authorization-request").send({
				response_type,
				client_id,
				redirect_uri,
				scope,
				issuer_state,
				state,
				code_challenge,
				code_challenge_method,
			});

			const response = await request(app)
				.post("/authorize")
				.send({ username, password })
				.query({ client_id, request_uri });

			expect(response.status).toBe(302);
			expect(response.headers.location).toMatch(redirect_uri);
			expect(response.headers.location).toMatch(/code=.+/);
			expect(response.headers.location).toMatch(/state=.+/);

			const [_all, authorization_code] =
				/code=([^&]+)/.exec(response.headers.location) || [];

			const { payload } = await jwtDecrypt(
				authorization_code,
				new TextEncoder().encode(protocols.config.secret),
			);

			expect(payload.scope).to.eq(scope);
			expect(payload.sub).to.eq("sub");
			expect(payload.redirect_uri).to.eq(redirect_uri);
		});
	});

	describe("user credentials are invalid", () => {
		const username = "invalid";
		const password = "invalid";

		it("returns an error", async () => {
			const response = await request(app)
				.post("/authorize")
				.send({ username, password });

			expect(response.status).toBe(400);
			expect(response.text).toMatch(
				"client id is missing from request parameters",
			);
		});

		it("returns an error with client id", async () => {
			const client_id = "id";
			const response = await request(app)
				.post("/authorize")
				.send({ username, password })
				.query({ client_id });

			expect(response.status).toBe(400);
			expect(response.text).toMatch(client_id);
			expect(response.text).toMatch(
				"request uri is missing from request parameters",
			);
		});

		it("returns an error with invalid request uri", async () => {
			const client_id = "id";
			const request_uri = "urn:wwwallet:authorization_request:invalid";
			const response = await request(app)
				.post("/authorize")
				.send({ username, password })
				.query({ client_id, request_uri });

			expect(response.status).toBe(400);
			expect(response.text).toMatch(request_uri);
			expect(response.text).toMatch("authorization request is invalid");
		});

		it.skip("returns an error with invalid scope");

		it.skip("returns an error with invalid issuer state");

		it("returns with a valid request uri", async () => {
			const response_type = "code";
			const client_id = "id";
			const redirect_uri = "http://redirect.uri";
			const scope = "client:scope";
			const code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
			const code_challenge_method = "S256";

			const {
				body: { request_uri },
			} = await request(app).post("/pushed-authorization-request").send({
				response_type,
				client_id,
				redirect_uri,
				scope,
				issuer_state,
				code_challenge,
				code_challenge_method,
			});

			const response = await request(app)
				.post("/authorize")
				.send({ username, password })
				.query({ client_id, request_uri });

			expect(response.status).toBe(200);
			expect(response.text).toMatch(request_uri);
			expect(response.text).toMatch("invalid username or password");
		});
	});
});

describe("authorization code - token", () => {
	it("returns an error with a grant type", async () => {
		const grant_type = "authorization_code";

		const response = await request(app).post("/token").send({ grant_type });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "code is missing from body parameters",
		});
	});

	it("returns an error with a client id", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "code is missing from body parameters",
		});
	});

	it("returns an error with a redirect uri", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "code is missing from body parameters",
		});
	});

	it("returns an error with an invalid client", async () => {
		const grant_type = "authorization_code";
		const client_id = "invalid";
		const redirect_uri = "http://redirect.uri";
		const code = "code";

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code });

		expect(response.status).toBe(401);
		expect(response.body).to.deep.eq({
			error: "invalid_client",
			error_description: "invalid client credentials",
		});
	});

	it("returns an error with an invalid authorization code", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const code = "code";

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "authorization code is invalid",
		});
	});

	it("returns an error when authorization code redirect uri does not match request redirect_uri", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";
		const code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
		const code_challenge_method = "S256";
		const code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			redirect_uri: "http://other.uri",
			code_challenge,
			code_challenge_method,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code, code_verifier });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "authorization code is invalid",
		});
	});

	it("returns an error without redirect_uri", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const code = "code";

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, code });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "redirect_uri is missing from body parameters",
		});
	});

	it("returns an error with invalid token type", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({ sub, token_type: "invalid" })
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code });

		expect(response.status).toBe(400);
		expect(response.body).deep.eq({
			error: "invalid_request",
			error_description: "authorization code is invalid",
		});
	});

	it("returns an error with invalid oauth client attestation", async () => {
		const grant_type = "authorization_code";
		const oauth_client_attestation = "invalid";
		const redirect_uri = "http://invalid.uri";
		const sub = "sub";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			redirect_uri: "http://invalid.uri",
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.set("Oauth-Client-Attestation", oauth_client_attestation)
			.send({ grant_type, redirect_uri, code });

		expect(response.status).toBe(401);
		expect(response.body).deep.eq({
			error: "invalid_client",
			error_description:
				"oauth client attestation does not match any known client",
		});
	});

	it("returns an error with an invalid redirect uri", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://invalid.uri";
		const code = "code";

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code });

		expect(response.status).toBe(401);
		expect(response.body).to.deep.eq({
			error: "invalid_client",
			error_description: "invalid client credentials",
		});
	});

	it("returns an error without code challenge", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			redirect_uri,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code });

		expect(response.status).toBe(400);
		expect(response.body).deep.eq({
			error: "invalid_request",
			error_description: "code challenge is missing from authorization request",
		});
	});

	it("returns an error without code challenge method", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";
		const code_challenge = "test";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			code_challenge,
			redirect_uri,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code });

		expect(response.status).toBe(400);
		expect(response.body).deep.eq({
			error: "invalid_request",
			error_description:
				"code challenge method is missing from authorization request",
		});
	});

	it("returns an error with an invalid code challenge method", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";
		const code_challenge = "test";
		const code_challenge_method = "invalid";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			code_challenge,
			code_challenge_method,
			redirect_uri,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code });

		expect(response.status).toBe(400);
		expect(response.body).deep.eq({
			error: "invalid_request",
			error_description: "only S256 code challenge method is supported",
		});
	});

	it("returns an error without code verifier", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";
		const code_challenge = "test";
		const code_challenge_method = "S256";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			code_challenge,
			code_challenge_method,
			redirect_uri,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code });

		expect(response.status).toBe(400);
		expect(response.body).deep.eq({
			error: "invalid_request",
			error_description:
				"Proof Key for Code Exchange requests require a code verifier",
		});
	});

	it("returns an error with an invalid code verifier", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";
		const code_challenge = "test";
		const code_challenge_method = "S256";
		const code_verifier = "invalid";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			code_challenge,
			code_challenge_method,
			redirect_uri,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code, code_verifier });

		expect(response.status).toBe(400);
		expect(response.body).deep.eq({
			error: "invalid_request",
			error_description: "code verifier is invalid",
		});
	});

	it("returns an error with an invalid code verifier", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";
		const code_challenge = "test";
		const code_challenge_method = "S256";
		const code_verifier = "invalid";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			code_challenge,
			code_challenge_method,
			redirect_uri,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code, code_verifier });

		expect(response.status).toBe(400);
		expect(response.body).deep.eq({
			error: "invalid_request",
			error_description: "code verifier is invalid",
		});
	});

	it("returns an error with a short code verifier", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";
		const code_verifier = "short-verifier";
		const code_challenge = crypto
			.createHash("sha256")
			.update(code_verifier)
			.digest("base64url");
		const code_challenge_method = "S256";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			code_challenge,
			code_challenge_method,
			redirect_uri,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code, code_verifier });

		expect(response.status).toBe(400);
		expect(response.body).deep.eq({
			error: "invalid_request",
			error_description: "code verifier is invalid",
		});
	});

	it("returns a token", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";
		const code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
		const code_challenge_method = "S256";
		const code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			code_challenge,
			code_challenge_method,
			redirect_uri,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code, code_verifier });

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.refresh_token);
		assert(response.body.expires_in);
		expect(response.body.token_type).to.eq("bearer");

		const { payload } = await jwtDecrypt(
			response.body.access_token,
			new TextEncoder().encode(protocols.config.secret),
		);

		assert(
			protocols.config.clients?.find(({ id }) => id === payload.client_id),
		);
		expect(payload.sub).to.eq(sub);

		const { payload: refreshPayload } = await jwtDecrypt(
			response.body.refresh_token,
			new TextEncoder().encode(protocols.config.secret),
		);
		expect(refreshPayload.token_type).to.eq("refresh_token");
		expect(refreshPayload.client_id).to.eq(client_id);
		expect(refreshPayload.sub).to.eq(sub);
	});

	it.skip("returns a token with an oauth client attestation", async () => {
		const privateKey = crypto.createPrivateKey(trustedPem);
		const grant_type = "authorization_code";
		const oauth_client_attestation = await new SignJWT({ sub: "id" })
			.setProtectedHeader({ typ: "oauth-client-attestation+jwt", alg: "RS256" })
			.sign(privateKey);
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";
		const code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
		const code_challenge_method = "S256";
		const code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			code_challenge,
			code_challenge_method,
			redirect_uri,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.set("Oauth-Client-Attestation", oauth_client_attestation)
			.send({ grant_type, code, code_verifier });

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.expires_in);
		expect(response.body.token_type).to.eq("bearer");

		const { payload } = await jwtDecrypt(
			response.body.access_token,
			new TextEncoder().encode(protocols.config.secret),
		);

		assert(
			protocols.config.clients?.find(({ id }) => id === payload.client_id),
		);
		expect(payload.sub).to.eq(sub);
	});

	it("returns a token with a scope", async () => {
		const scope = "scope";
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";
		const code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
		const code_challenge_method = "S256";
		const code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const code = await new EncryptJWT({
			sub,
			scope,
			token_type: "authorization_code",
			code_challenge,
			code_challenge_method,
			redirect_uri,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code, code_verifier });

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.expires_in);
		expect(response.body.token_type).to.eq("bearer");

		const { payload } = await jwtDecrypt(
			response.body.access_token,
			new TextEncoder().encode(protocols.config.secret),
		);

		assert(
			protocols.config.clients?.find(({ id }) => id === payload.client_id),
		);
		expect(payload.sub).to.eq(sub);
		expect(payload.scope).to.eq(scope);
	});
});
