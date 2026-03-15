import { EncryptJWT, jwtDecrypt } from "jose";
import request from "supertest";
import { assert, describe, expect, it } from "vitest";
import { app, protocols } from "../support/app";

describe("refresh token - token endpoint", () => {
	it("returns an error without refresh_token", async () => {
		const response = await request(app).post("/token").send({
			grant_type: "refresh_token",
			client_id: "id",
			client_secret: "secret",
		});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "refresh_token is missing from body parameters",
		});
	});

	it("returns an error with non-string refresh_token", async () => {
		const response = await request(app).post("/token").send({
			grant_type: "refresh_token",
			client_id: "id",
			client_secret: "secret",
			refresh_token: {},
		});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "refresh_token is missing from body parameters",
		});
	});

	it("returns an error with an invalid refresh token", async () => {
		const response = await request(app).post("/token").send({
			grant_type: "refresh_token",
			client_id: "id",
			client_secret: "secret",
			refresh_token: "invalid",
		});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "refresh token is invalid",
		});
	});

	it("returns a rotated refresh token and access token", async () => {
		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const refresh_token = await new EncryptJWT({
			token_type: "refresh_token",
			client_id: "id",
			sub: "sub",
			scope: "client:scope",
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.refresh_token_ttl || 0))
			.encrypt(secret);

		const response = await request(app).post("/token").send({
			grant_type: "refresh_token",
			client_id: "id",
			client_secret: "secret",
			refresh_token,
		});

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.refresh_token);
		expect(response.body.refresh_token).not.to.eq(refresh_token);
		expect(response.body.token_type).to.eq("bearer");

		const { payload: accessTokenPayload } = await jwtDecrypt(
			response.body.access_token,
			new TextEncoder().encode(protocols.config.secret),
		);
		expect(accessTokenPayload.client_id).to.eq("id");
		expect(accessTokenPayload.sub).to.eq("sub");
		expect(accessTokenPayload.scope).to.eq("client:scope");

		const { payload: refreshTokenPayload } = await jwtDecrypt(
			response.body.refresh_token,
			new TextEncoder().encode(protocols.config.secret),
		);
		expect(refreshTokenPayload.client_id).to.eq("id");
		expect(refreshTokenPayload.sub).to.eq("sub");
		expect(refreshTokenPayload.scope).to.eq("client:scope");
	});

	it("returns an error with refresh token missing subject claim", async () => {
		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const refresh_token = await new EncryptJWT({
			token_type: "refresh_token",
			client_id: "id",
			scope: "client:scope",
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.refresh_token_ttl || 0))
			.encrypt(secret);

		const response = await request(app).post("/token").send({
			grant_type: "refresh_token",
			client_id: "id",
			client_secret: "secret",
			refresh_token,
		});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "refresh token is invalid",
		});
	});

	it("returns an error with refresh token subject claim type invalid", async () => {
		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const refresh_token = await new EncryptJWT({
			token_type: "refresh_token",
			client_id: "id",
			sub: {},
			scope: "client:scope",
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.refresh_token_ttl || 0))
			.encrypt(secret);

		const response = await request(app).post("/token").send({
			grant_type: "refresh_token",
			client_id: "id",
			client_secret: "secret",
			refresh_token,
		});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "refresh token is invalid",
		});
	});

	it("returns an error with refresh token missing scope claim", async () => {
		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const refresh_token = await new EncryptJWT({
			token_type: "refresh_token",
			client_id: "id",
			sub: "sub",
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.refresh_token_ttl || 0))
			.encrypt(secret);

		const response = await request(app).post("/token").send({
			grant_type: "refresh_token",
			client_id: "id",
			client_secret: "secret",
			refresh_token,
		});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "refresh token is invalid",
		});
	});

	it("returns an error with refresh token empty scope claim", async () => {
		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const refresh_token = await new EncryptJWT({
			token_type: "refresh_token",
			client_id: "id",
			sub: "sub",
			scope: " ",
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.refresh_token_ttl || 0))
			.encrypt(secret);

		const response = await request(app).post("/token").send({
			grant_type: "refresh_token",
			client_id: "id",
			client_secret: "secret",
			refresh_token,
		});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "refresh token is invalid",
		});
	});

	it("returns an error with refresh token missing iat claim", async () => {
		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const refresh_token = await new EncryptJWT({
			token_type: "refresh_token",
			client_id: "id",
			sub: "sub",
			scope: "client:scope",
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setExpirationTime(now + (protocols.config.refresh_token_ttl || 0))
			.encrypt(secret);

		const response = await request(app).post("/token").send({
			grant_type: "refresh_token",
			client_id: "id",
			client_secret: "secret",
			refresh_token,
		});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "refresh token is invalid",
		});
	});

	it("returns an error with refresh token iat in the future", async () => {
		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const refresh_token = await new EncryptJWT({
			token_type: "refresh_token",
			client_id: "id",
			sub: "sub",
			scope: "client:scope",
			iat: Math.floor(now + 60),
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setExpirationTime(now + (protocols.config.refresh_token_ttl || 0))
			.encrypt(secret);

		const response = await request(app).post("/token").send({
			grant_type: "refresh_token",
			client_id: "id",
			client_secret: "secret",
			refresh_token,
		});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "refresh token is invalid",
		});
	});

	it("returns an error if requested scope is not a subset of original scope", async () => {
		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const refresh_token = await new EncryptJWT({
			token_type: "refresh_token",
			client_id: "id",
			sub: "sub",
			scope: "client:scope",
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.refresh_token_ttl || 0))
			.encrypt(secret);

		const response = await request(app).post("/token").send({
			grant_type: "refresh_token",
			client_id: "id",
			client_secret: "secret",
			refresh_token,
			scope: "full:scope",
		});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "invalid scope",
		});
	});

	it("returns an error when requested scope claim type is invalid", async () => {
		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const refresh_token = await new EncryptJWT({
			token_type: "refresh_token",
			client_id: "id",
			sub: "sub",
			scope: "client:scope",
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.refresh_token_ttl || 0))
			.encrypt(secret);

		const response = await request(app).post("/token").send({
			grant_type: "refresh_token",
			client_id: "id",
			client_secret: "secret",
			refresh_token,
			scope: {},
		});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "invalid scope",
		});
	});
});
