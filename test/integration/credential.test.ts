import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../support/app";

describe("credential endpoint", () => {
	it("returns an error", async () => {
		const response = await request(app).post("/credential");

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "credential endpoint not implemented",
		});
	});
});
