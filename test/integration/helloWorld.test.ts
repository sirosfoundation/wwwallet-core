import request from "supertest";
import { describe, expect, it } from "vitest";
import { server } from "../../app";
import { Core } from "../../src";
import { app } from "../support/app";

describe("hello world", () => {
	it("renders", async () => {
		const response = await request(app).get("/");

		expect(response.status).toBe(200);
		expect(response.text).toBe("Hello World!");
	});
});

describe("healthz", () => {
	it("returns an error", async () => {
		const unconfiguredApp = server(new Core({}));
		const response = await request(unconfiguredApp).get("/healthz");

		expect(response.status).toBe(500);
		expect(response.text).toBe(
			"Could not validate credentialOffer handler configuration - data must have required property 'issuer_url'",
		);
	});

	it("renders", async () => {
		const response = await request(app).get("/healthz");
		expect(response.status).toBe(200);
		expect(response.text).toBe("ok");
	});
});
