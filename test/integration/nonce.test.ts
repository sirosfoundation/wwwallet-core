import { jwtDecrypt } from "jose";
import request from "supertest";
import { assert, describe, expect, it } from "vitest";
import { app, core } from "../support/app";

describe("nonce endpoint", () => {
	it("renders", async () => {
		const response = await request(app).get("/nonce");

		expect(response.status).toBe(200);
		assert(response.body.c_nonce);
		const { payload } = await jwtDecrypt(
			response.body.c_nonce,
			new TextEncoder().encode(core.config.secret),
		);
		expect(payload.sub).to.eq(core.config.issuer_client?.id);
	});
});
