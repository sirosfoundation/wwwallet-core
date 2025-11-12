import { jwtDecrypt } from "jose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, core } from "../support/app";

describe("credential offer endpoint", () => {
	it("returns an error with no accept header", async () => {
		const scope = "bad:scope";
		const response = await request(app).get(`/offer/${scope}`);

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "accept header is missing from request",
		});
	});

	it("returns an error with a bad scope", async () => {
		const scope = "bad:scope";
		const response = await request(app)
			.get(`/offer/${scope}`)
			.set("Accept", "application/json");

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "invalid scope",
		});
	});

	it("returns an error when credential not found", async () => {
		const scope = "not_found:scope";
		const response = await request(app)
			.get(`/offer/${scope}`)
			.set("Accept", "application/json");

		expect(response.status).toBe(404);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "credential not supported by the issuer",
		});
	});

	it("returns a credential offer (application/json)", async () => {
		const scope = "full:scope";
		const response = await request(app)
			.get(`/offer/${scope}`)
			.set("Accept", "application/json");

		expect(response.status).toBe(200);
		expect(response.body.credential_offer_qrcode).toMatch(
			"data:image/png;base64",
		);
		expect(response.body.credential_offer_url).toMatch(
			core.config.wallet_url || "",
		);
		expect(response.body.credential_offer_url).toMatch(
			encodeURIComponent(core.config.issuer_url || ""),
		);
		expect(response.body.credential_offer_url).toMatch("full"); // credential_configuration_id
		expect(response.body.credential_offer_url).toMatch("issuer_state"); // credential_configuration_id
		const [_all, issuer_state] = /issuer_state%22%3A%22([^%]+)%22/.exec(
			response.body.credential_offer_url,
		) || [""];

		const { payload } = await jwtDecrypt(
			issuer_state,
			new TextEncoder().encode(core.config.secret),
		);
		expect(payload.sub).to.eq(core.config.issuer_client?.id);
	});

	it("returns a credential offer (mso_mdoc)", async () => {
		const scope = "full:scope:mso_mdoc";
		const response = await request(app)
			.get(`/offer/${scope}`)
			.set("Accept", "application/json");

		expect(response.body.credential_offer_url).toMatch(
			core.config.wallet_url || "",
		);
		expect(response.body.credential_offer_url).toMatch(
			encodeURIComponent(core.config.issuer_url || ""),
		);
		expect(response.body.credential_offer_url).toMatch("full"); // credential_configuration_id
		expect(response.body.credential_offer_url).toMatch("issuer_state"); // credential_configuration_id
		const [_all, issuer_state] = /issuer_state%22%3A%22([^%]+)%22/.exec(
			response.body.credential_offer_url,
		) || [""];

		const { payload } = await jwtDecrypt(
			issuer_state,
			new TextEncoder().encode(core.config.secret),
		);
		expect(payload.sub).to.eq(core.config.issuer_client?.id);
	});

	it("returns a credential offer (text/html)", async () => {
		const scope = "full:scope";
		const response = await request(app)
			.get(`/offer/${scope}`)
			.set("Accept", "text/html");

		expect(response.status).toBe(200);
		expect(response.text).toMatch("Full (dc+sd-jwt)");
		expect(response.text).toMatch(core.config.wallet_url || "");
		expect(response.text).toMatch(
			encodeURIComponent(core.config.issuer_url || ""),
		);
		expect(response.text).toMatch("full"); // credential_configuration_id
		expect(response.text).toMatch("issuer_state"); // credential_configuration_id
		expect(response.text).toMatch("data:image/png;base64");
	});
});
