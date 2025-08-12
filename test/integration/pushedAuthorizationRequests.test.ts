import { jwtDecrypt } from "jose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, core } from "../support/app";

describe("pushshed authorization request endpoint", () => {
	it("returns an error without body", async () => {
		const response = await request(app).post("/pushed-authorization-request");

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "pushed authorization requests requires a body",
		});
	});

	it("returns an error with an empty body", async () => {
		const response = await request(app)
			.post("/pushed-authorization-request")
			.send({});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "response_type is invalid",
		});
	});

	it("returns an error with an invalid response_type", async () => {
		const response_type = "not_a_code";
		const response = await request(app)
			.post("/pushed-authorization-request")
			.send({ response_type });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "response_type is invalid",
		});
	});

	it("returns an error with a response_type", async () => {
		const response_type = "code";
		const response = await request(app)
			.post("/pushed-authorization-request")
			.send({ response_type });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "client_id is missing from body params",
		});
	});

	it("returns an error with a client_id", async () => {
		const response_type = "code";
		const client_id = "id";
		const response = await request(app)
			.post("/pushed-authorization-request")
			.send({ response_type, client_id });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "redirect_uri is missing from body params",
		});
	});

	it("returns an error with an invalid redirect_uri", async () => {
		const response_type = "code";
		const client_id = "id";
		const redirect_uri = "http://invalid.uri";
		const response = await request(app)
			.post("/pushed-authorization-request")
			.send({ response_type, client_id, redirect_uri });

		expect(response.status).toBe(401);
		expect(response.body).to.deep.eq({
			error: "invalid_client",
			error_description: "invalid client credentials",
		});
	});

	it("returns an error with an invalid scope", async () => {
		const response_type = "code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const scope = "invalid:scope";
		const response = await request(app)
			.post("/pushed-authorization-request")
			.send({ response_type, client_id, redirect_uri, scope });

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "invalid scope",
		});
	});

	it("returns", async () => {
		const response_type = "code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const response = await request(app)
			.post("/pushed-authorization-request")
			.send({ response_type, client_id, redirect_uri });

		expect(response.status).toBe(200);
		expect(response.body.expires_in).to.eq(
			core.config.pushed_authorization_request_ttl,
		);
		expect(response.body.request_uri).toMatch(
			"urn:wwwallet:authorization_request:ey",
		);

		const { payload } = await jwtDecrypt(
			response.body.request_uri.replace(
				"urn:wwwallet:authorization_request:",
				"",
			),
			new TextEncoder().encode(core.config.secret),
		);

		expect(payload.client_id).to.eq(client_id);
		expect(payload.redirect_uri).to.eq(redirect_uri);
		expect(payload.response_type).to.eq(response_type);
	});

	it("returns with valid scope", async () => {
		const response_type = "code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const scope = "client:scope";
		const response = await request(app)
			.post("/pushed-authorization-request")
			.send({ response_type, client_id, redirect_uri, scope });

		expect(response.status).toBe(200);
		expect(response.body.expires_in).to.eq(
			core.config.pushed_authorization_request_ttl,
		);
		expect(response.body.request_uri).toMatch(
			"urn:wwwallet:authorization_request:ey",
		);

		const { payload } = await jwtDecrypt(
			response.body.request_uri.replace(
				"urn:wwwallet:authorization_request:",
				"",
			),
			new TextEncoder().encode(core.config.secret),
		);

		expect(payload.client_id).to.eq(client_id);
		expect(payload.redirect_uri).to.eq(redirect_uri);
		expect(payload.response_type).to.eq(response_type);
	});
});
