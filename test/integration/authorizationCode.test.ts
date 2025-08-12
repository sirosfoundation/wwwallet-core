import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../support/app";

describe("authorization code - authorize", () => {
	it("returns an error", async () => {
		const response = await request(app).get("/authorize");

		expect(response.status).toBe(400);
		expect(response.text).toMatch(
			"client_id is missing from request parameters",
		);
	});

	it("returns an error with client_id", async () => {
		const client_id = "id";
		const response = await request(app).get("/authorize").query({ client_id });

		expect(response.status).toBe(400);
		expect(response.text).toMatch(
			"request_uri is missing from request parameters",
		);
	});

	it("returns an error with invalid request_uri", async () => {
		const client_id = "id";
		const request_uri = "urn:wwwallet:authorization_request:invalid";
		const response = await request(app)
			.get("/authorize")
			.query({ client_id, request_uri });

		expect(response.status).toBe(401);
		expect(response.text).toMatch("could not parse request_uri");
	});

	it("returns with a valid request_uri", async () => {
		const response_type = "code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const scope = "client:scope";

		const {
			body: { request_uri },
		} = await request(app)
			.post("/pushed-authorization-request")
			.send({ response_type, client_id, redirect_uri, scope });

		const response = await request(app)
			.get("/authorize")
			.query({ client_id, request_uri });

		expect(response.status).toBe(200);
		expect(response.text).toMatch(request_uri);
	});
});
