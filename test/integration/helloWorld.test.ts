import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../support/app";

describe("hello world", () => {
	it("renders", async () => {
		const response = await request(app).get("/");

		expect(response.status).toBe(302);
		expect(response.headers.location).to.eq("/offer/select-a-credential");
	});
});
