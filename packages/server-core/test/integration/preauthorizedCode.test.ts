import { EncryptJWT, jwtDecrypt } from "jose";
import request from "supertest";
import { assert, describe, expect, it } from "vitest";
import { app, protocols } from "../support/app";

describe("preauthorized code - token", () => {
	it("returns an error with a grant type", async () => {
		const grant_type = "urn:ietf:params:oauth:grant-type:pre-authorized_code";

		const response = await request(app).post("/token").send({ grant_type });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "client id is missing from body parameters",
		});
	});

	it("returns an error with a client id", async () => {
		const grant_type = "urn:ietf:params:oauth:grant-type:pre-authorized_code";
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
		const grant_type = "urn:ietf:params:oauth:grant-type:pre-authorized_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";

		const response = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "pre-authorized_code is missing from body parameters",
		});
	});

	it("returns an error with an invalid client", async () => {
		const grant_type = "urn:ietf:params:oauth:grant-type:pre-authorized_code";
		const client_id = "invalid";
		const redirect_uri = "http://redirect.uri";
		const preauthorized_code = "code";

		const response = await request(app).post("/token").send({
			grant_type,
			client_id,
			redirect_uri,
			"pre-authorized_code": preauthorized_code,
		});

		expect(response.status).toBe(401);
		expect(response.body).to.deep.eq({
			error: "invalid_client",
			error_description: "invalid client credentials",
		});
	});

	it("returns an error with an invalid authorization code", async () => {
		const grant_type = "urn:ietf:params:oauth:grant-type:pre-authorized_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const preauthorized_code = "code";

		const response = await request(app).post("/token").send({
			grant_type,
			client_id,
			redirect_uri,
			"pre-authorized_code": preauthorized_code,
		});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "preauthorized code is invalid",
		});
	});

	it("returns an error with invalid token type", async () => {
		const grant_type = "urn:ietf:params:oauth:grant-type:pre-authorized_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const preauthorized_code = await new EncryptJWT({
			sub,
			token_type: "invalid",
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app).post("/token").send({
			grant_type,
			client_id,
			redirect_uri,
			"pre-authorized_code": preauthorized_code,
		});

		expect(response.status).toBe(400);
		expect(response.body).deep.eq({
			error: "invalid_request",
			error_description: "preauthorized code is invalid",
		});
	});

	it("returns a token", async () => {
		const grant_type = "urn:ietf:params:oauth:grant-type:pre-authorized_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "preauthorized";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const preauthorized_code = await new EncryptJWT({
			token_type: "preauthorized_code",
			sub,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app).post("/token").send({
			grant_type,
			client_id,
			redirect_uri,
			"pre-authorized_code": preauthorized_code,
		});

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
		const grant_type = "urn:ietf:params:oauth:grant-type:pre-authorized_code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const sub = "sub";

		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);
		const preauthorized_code = await new EncryptJWT({
			sub,
			scope,
			token_type: "preauthorized_code",
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app).post("/token").send({
			grant_type,
			client_id,
			redirect_uri,
			"pre-authorized_code": preauthorized_code,
		});

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.expires_in);
		expect(response.body.token_type).to.eq("bearer");

		const { payload } = await jwtDecrypt(
			response.body.access_token,
			new TextEncoder().encode(protocols.config.secret),
		);

		expect(payload.sub).to.eq(sub);
		expect(payload.scope).to.eq(scope);
	});
});
