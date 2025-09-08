import { jwtDecrypt } from "jose";
import request from "supertest";
import { assert, describe, expect, it } from "vitest";
import { app, core } from "../support/app";

describe("client credentials flow", () => {
	it("returns an error with no body", async () => {
		const response = await request(app).post("/token");

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "client credentials requests require a body",
		});
	});

	it("returns an error with invalid grant type", async () => {
		const grant_type = "invalid_grant_type";

		const response = await request(app).post("/token").send({ grant_type });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "grant_type is not supported",
		});
	});

	it("returns an error with a grant type", async () => {
		const grant_type = "client_credentials";

		const response = await request(app).post("/token").send({ grant_type });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "client id is missing from body parameters",
		});
	});

	it("returns an error with client id", async () => {
		const grant_type = "client_credentials";
		const client_id = "client_id";

		const response = await request(app)
			.post("/token")
			.send({ client_id, grant_type });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "client secret is missing from body parameters",
		});
	});

	it("returns an error with invalid client secret", async () => {
		const grant_type = "client_credentials";
		const client_id = "id";
		const client_secret = "client_secret";

		const response = await request(app)
			.post("/token")
			.send({ client_id, grant_type, client_secret });

		expect(response.status).toBe(401);
		expect(response.body).to.deep.eq({
			error: "invalid_client",
			error_description: "invalid client credentials",
		});
	});

	it("returns an error with bad scope", async () => {
		const grant_type = "client_credentials";
		const client_id = "id";
		const client_secret = "secret";
		const scope = "bad:scope";

		const response = await request(app)
			.post("/token")
			.send({ client_id, grant_type, client_secret, scope });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "invalid scope",
		});
	});

	it("returns a token with valid client", async () => {
		const grant_type = "client_credentials";
		const client_id = "id";
		const client_secret = "secret";

		const response = await request(app)
			.post("/token")
			.send({ client_id, grant_type, client_secret });

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.expires_in);
		expect(response.body.token_type).to.eq("bearer");

		const { payload } = await jwtDecrypt(
			response.body.access_token,
			new TextEncoder().encode(core.config.secret),
		);

		assert(core.config.clients?.find(({ id }) => id === payload.client_id));
		assert(core.config.clients?.find(({ id }) => id === payload.sub));
	});

	it("returns a token with www-form-urlencoded", async () => {
		const grant_type = "client_credentials";
		const client_id = "id";
		const client_secret = "secret";

		const response = await request(app)
			.post("/token")
			.type("form")
			.send({ client_id, grant_type, client_secret });

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.expires_in);
		expect(response.body.token_type).to.eq("bearer");
	});

	it("returns a token with scope", async () => {
		const grant_type = "client_credentials";
		const client_id = "id";
		const client_secret = "secret";
		const scope = "client:scope";

		const response = await request(app)
			.post("/token")
			.send({ client_id, grant_type, client_secret, scope });

		expect(response.status).toBe(200);
		assert(response.body.access_token);
		assert(response.body.expires_in);
		expect(response.body.token_type).to.eq("bearer");

		const { payload } = await jwtDecrypt(
			response.body.access_token,
			new TextEncoder().encode(core.config.secret),
		);

		expect(payload.scope).to.eq(scope);
		assert(core.config.clients?.find(({ id }) => id === payload.client_id));
		assert(core.config.clients?.find(({ id }) => id === payload.sub));
	});
});
