import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../app";

describe("hello world", () => {
	it("renders", async () => {
		const response = await request(app).get("/");

		expect(response.status).toBe(200);
		expect(response.text).toBe("Hello World!");
	});
});
