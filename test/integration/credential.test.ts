import { EncryptJWT } from "jose";
import request from "supertest";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { app, core } from "../support/app";

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

	it("returns an error without authorization header", async () => {
		const credential_configuration_id = "unknwown:configuration:id";
		const response = await request(app)
			.post("/credential")
			.send({ credential_configuration_id });

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
			.send({ credential_configuration_id });

		expect(response.status).toBe(401);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "access token is invalid",
		});
	});

	it("returns an error with an access token with an invalid type", async () => {
		const sub = "sub";
		const credential_configuration_id = "unknwown:configuration:id";

		const secret = new TextEncoder().encode(core.config.secret);
		const now = Date.now() / 1000;
		const access_token = await new EncryptJWT({ sub, token_type: "invalid" })
			.setProtectedHeader({
				alg: "dir",
				enc: core.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (core.config.issuer_state_ttl || 0))
			.encrypt(secret);

		const response = await request(app)
			.post("/credential")
			.set("Authorization", `DPoP ${access_token}`)
			.send({ credential_configuration_id });

		expect(response.status).toBe(401);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "access token is invalid",
		});
	});

	describe("with a valid access token", () => {
		const sub = "sub";
		let access_token: string;
		beforeEach(async () => {
			const secret = new TextEncoder().encode(core.config.secret);
			const now = Date.now() / 1000;
			access_token = await new EncryptJWT({ sub, token_type: "access_token" })
				.setProtectedHeader({
					alg: "dir",
					enc: core.config.token_encryption || "",
				})
				.setIssuedAt()
				.setExpirationTime(now + (core.config.issuer_state_ttl || 0))
				.encrypt(secret);
		});

		it("returns empty credential list with unknown credential configuration id", async () => {
			const credential_configuration_id = "unknwown:configuration:id";
			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.send({ credential_configuration_id });

			expect(response.status).toBe(404);
			expect(response.body).to.deep.eq({
				error: "invalid_credential",
				error_description: "credential not found",
			});
		});

		it("returns empty credential list with unknown credential configuration ids", async () => {
			const credential_configuration_ids = ["unknwown:configuration:id"];
			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.send({ credential_configuration_ids });

			expect(response.status).toBe(404);
			expect(response.body).to.deep.eq({
				error: "invalid_credential",
				error_description: "credential not found",
			});
		});

		it("returns credentials with DPoP token type", async () => {
			const credential_configuration_id = "full";
			const response = await request(app)
				.post("/credential")
				.set("Authorization", `DPoP ${access_token}`)
				.send({ credential_configuration_id });

			expect(response.status).toBe(200);
			assert(response.body.credentials[0].credential);
		});

		it("returns credentials with bearer token type", async () => {
			const credential_configuration_id = "full";
			const response = await request(app)
				.post("/credential")
				.set("Authorization", `bearer ${access_token}`)
				.send({ credential_configuration_id });

			expect(response.status).toBe(200);
			assert(response.body.credentials[0].credential);
		});

		it("returns credentials with Bearer token type", async () => {
			const credential_configuration_id = "full";
			const response = await request(app)
				.post("/credential")
				.set("Authorization", `Bearer ${access_token}`)
				.send({ credential_configuration_id });

			expect(response.status).toBe(200);
			assert(response.body.credentials[0].credential);
		});
	});
});
