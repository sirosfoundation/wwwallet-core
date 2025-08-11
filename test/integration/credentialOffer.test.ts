import request from "supertest";
import { assert, describe, expect, it } from "vitest";
import { app, core } from "../support/app";

const credentialOfferQrCode =
	"data:image/png;base64,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";
const credentialOfferUrl =
	"http://localhost:3000/?credential_offer=%7B%22credential_issuer%22%3A%22http%3A%2F%2Flocalhost%3A5000%22%2C%22credential_configuration_ids%22%3A%5B%22full%22%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%22issuer_state%22%3A%22issuerStateGeneratedToken%22%7D%7D%7D";

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

		expect(
			core.config.databaseOperations.__authorizationServerState,
		).to.deep.eq({
			scope: "",
			format: "",
			issuer_state: "issuerStateGeneratedToken",
			id: 0,
			credential_configuration_ids: ["full"],
		});
		expect(response.status).toBe(200);
		expect(response.body).to.deep.eq({
			credential_offer_url: credentialOfferUrl,
			credential_offer_qrcode: credentialOfferQrCode,
		});
	});

	it("returns a credential offer (mso_mdoc)", async () => {
		const scope = "full:scope:mso_mdoc";
		const response = await request(app)
			.get(`/offer/${scope}`)
			.set("Accept", "application/json");

		expect(
			core.config.databaseOperations.__authorizationServerState,
		).to.deep.eq({
			scope: "",
			format: "",
			issuer_state: "issuerStateGeneratedToken",
			id: 0,
			credential_configuration_ids: ["test.mso_mdoc.full"],
		});

		expect(response.status).toBe(200);
		expect(response.body.credential_offer_url).to.eq(
			"http://localhost:3000/?credential_offer=%7B%22credential_issuer%22%3A%22http%3A%2F%2Flocalhost%3A5000%22%2C%22credential_configuration_ids%22%3A%5B%22test.mso_mdoc.full%22%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%22issuer_state%22%3A%22issuerStateGeneratedToken%22%7D%7D%7D",
		);
		assert(response.body.credential_offer_qrcode);
	});

	it("returns a credential offer (text/html)", async () => {
		const scope = "full:scope";
		const response = await request(app)
			.get(`/offer/${scope}`)
			.set("Accept", "text/html");

		expect(
			core.config.databaseOperations.__authorizationServerState,
		).to.deep.eq({
			scope: "",
			format: "",
			issuer_state: "issuerStateGeneratedToken",
			id: 0,
			credential_configuration_ids: ["full"],
		});
		expect(response.status).toBe(200);
		expect(response.text).toMatch("Full (dc+sd-jwt)");
		expect(response.text).toMatch(credentialOfferUrl);
		expect(response.text).toMatch(credentialOfferQrCode);
	});
});
