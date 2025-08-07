import { jwtDecrypt } from "jose";
import request from "supertest";
import { assert, describe, expect, it } from "vitest";
import { app, config } from "../support/app";

describe("client credentials flow", () => {
	it("returns an error with no body", async () => {
		const response = await request(app).post("/token");

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "client credentials requests requires a body",
		});
	});

	it("returns an error with client_id", async () => {
		const client_id = "client_id";

		const response = await request(app).post("/token").send({ client_id });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "client_secret is missing from body params",
		});
	});

	it("returns an error with invalid client_secret", async () => {
		const client_id = "id";
		const client_secret = "client_secret";

		const response = await request(app)
			.post("/token")
			.send({ client_id, client_secret });

		expect(response.status).toBe(401);
		expect(response.body).to.deep.eq({
			error: "invalid_client",
			error_description: "invalid client_id or client_secret",
		});
	});

	it("returns an error with bad scope", async () => {
		const client_id = "id";
		const client_secret = "secret";
		const scope = "bad:scope";

		const response = await request(app)
			.post("/token")
			.send({ client_id, client_secret, scope });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "invalid scope",
		});
	});

	it("returns a token with valid client", async () => {
		const client_id = "id";
		const client_secret = "secret";

		const response = await request(app)
			.post("/token")
			.send({ client_id, client_secret });

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.expires_in);
		expect(response.body.token_type).to.eq("bearer");
	});

	it("returns a token with www-form-urlencoded", async () => {
		const client_id = "id";
		const client_secret = "secret";

		const response = await request(app)
			.post("/token")
			.type("form")
			.send({ client_id, client_secret });

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.expires_in);
		expect(response.body.token_type).to.eq("bearer");
	});

	it("returns a token with scope", async () => {
		const client_id = "id";
		const client_secret = "secret";
		const scope = "client:scope";

		const response = await request(app)
			.post("/token")
			.send({ client_id, client_secret, scope });

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.expires_in);
		expect(response.body.token_type).to.eq("bearer");

		const { payload } = await jwtDecrypt(
			response.body.access_token,
			new TextEncoder().encode(config.secret),
		);

		expect(payload.scope).to.eq(scope);
		assert(config.clients.find(({ id }) => id === payload.sub));
	});
});
