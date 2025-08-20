import { EncryptJWT, jwtDecrypt } from "jose";
import request from "supertest";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { app, core } from "../support/app";

describe("authorization code - authorize", () => {
	let issuer_state: string;
	beforeEach(async () => {
		const now = Date.now() / 1000;

		const secret = new TextEncoder().encode(core.config.secret);

		issuer_state = await new EncryptJWT({ sub: core.config.issuer_client?.id })
			.setProtectedHeader({
				alg: "dir",
				enc: core.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (core.config.issuer_state_ttl || 0))
			.encrypt(secret);
	});

	it("returns an error", async () => {
		const response = await request(app).get("/authorize");

		expect(response.status).toBe(400);
		expect(response.text).toMatch(
			"client id is missing from request parameters",
		);
	});

	it("returns an error with client id", async () => {
		const client_id = "id";
		const response = await request(app).get("/authorize").query({ client_id });

		expect(response.status).toBe(400);
		expect(response.text).toMatch(
			"request uri is missing from request parameters",
		);
	});

	it("returns an error with invalid request uri", async () => {
		const client_id = "id";
		const request_uri = "urn:wwwallet:authorization_request:invalid";
		const response = await request(app)
			.get("/authorize")
			.query({ client_id, request_uri });

		expect(response.status).toBe(400);
		expect(response.text).toMatch("authorization request is invalid");
	});

	it.skip("returns an error with invalid scope");

	it.skip("returns an error with invalid issuer_state");

	it("returns with a valid request uri", async () => {
		const response_type = "code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const scope = "client:scope";

		const {
			body: { request_uri },
		} = await request(app)
			.post("/pushed-authorization-request")
			.send({ response_type, client_id, redirect_uri, scope, issuer_state });

		const response = await request(app)
			.get("/authorize")
			.query({ client_id, request_uri });

		expect(response.status).toBe(200);
		expect(response.text).toMatch(request_uri);
	});
});

describe("authorization code - authenticate", () => {
	let issuer_state: string;
	beforeEach(async () => {
		const now = Date.now() / 1000;

		const secret = new TextEncoder().encode(core.config.secret);

		issuer_state = await new EncryptJWT({ sub: core.config.issuer_client?.id })
			.setProtectedHeader({
				alg: "dir",
				enc: core.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (core.config.issuer_state_ttl || 0))
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

		it("returns with a valid request uri", async () => {
			const response_type = "code";
			const client_id = "id";
			const redirect_uri = "http://redirect.uri";
			const scope = "client:scope";
			const state = "state";

			const {
				body: { request_uri },
			} = await request(app).post("/pushed-authorization-request").send({
				response_type,
				client_id,
				redirect_uri,
				scope,
				issuer_state,
				state,
			});

			const response = await request(app)
				.post("/authorize")
				.send({ username, password })
				.query({ client_id, request_uri });

			expect(response.status).toBe(302);
			expect(response.headers.location).toMatch(redirect_uri);
			expect(response.headers.location).toMatch(/code=.+/);
			expect(response.headers.location).toMatch(/state=.+/);
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

			const {
				body: { request_uri },
			} = await request(app)
				.post("/pushed-authorization-request")
				.send({ response_type, client_id, redirect_uri, scope, issuer_state });

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
			error_description: "client id is missing from body parameters",
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
			error_description: "redirect uri is missing from body parameters",
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

	it("returns an error with invalid token type", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(core.config.secret);
		const code = await new EncryptJWT({ sub, token_type: "invalid" })
			.setProtectedHeader({
				alg: "dir",
				enc: core.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (core.config.issuer_state_ttl || 0))
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

	it("returns an error with invalid redirect uri", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(core.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			redirect_uri: "http://invalid.uri",
		})
			.setProtectedHeader({
				alg: "dir",
				enc: core.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (core.config.issuer_state_ttl || 0))
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

	it("returns a token", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(core.config.secret);
		const code = await new EncryptJWT({
			sub,
			token_type: "authorization_code",
			redirect_uri,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: core.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (core.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code });

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.expires_in);
		expect(response.body.token_type).to.eq("bearer");

		const { payload } = await jwtDecrypt(
			response.body.access_token,
			new TextEncoder().encode(core.config.secret),
		);

		assert(core.config.clients?.find(({ id }) => id === payload.client_id));
		expect(payload.sub).to.eq(sub);
	});

	it("returns a token with a scope", async () => {
		const grant_type = "authorization_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";
		const scope = "scope";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(core.config.secret);
		const code = await new EncryptJWT({
			token_type: "authorization_code",
			redirect_uri,
			sub,
			scope,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: core.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (core.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code });

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.expires_in);
		expect(response.body.token_type).to.eq("bearer");

		const { payload } = await jwtDecrypt(
			response.body.access_token,
			new TextEncoder().encode(core.config.secret),
		);

		assert(core.config.clients?.find(({ id }) => id === payload.client_id));
		expect(payload.sub).to.eq(sub);
		expect(payload.scope).to.eq(scope);
	});
});
