import request from "supertest";
import { describe, expect, it } from "vitest";
import { Protocols } from "../../src";
import { app, server } from "../support/app";

describe("hello world", () => {
	it("renders", async () => {
		const response = await request(app).get("/");

		expect(response.status).toBe(302);
		expect(response.headers.location).to.eq("/offer/select-a-credential");
	});
});

describe("healthz", () => {
	it("returns an error", async () => {
		// @ts-ignore
		const unconfiguredApp = server(new Protocols({}));
		const response = await request(unconfiguredApp).get("/healthz");

		expect(response.status).toBe(500);
	});

	it("renders", async () => {
		const response = await request(app).get("/healthz");
		expect(response.status).toBe(200);
		expect(response.text).toBe("ok");
	});
});
