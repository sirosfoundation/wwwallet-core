import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../support/app";

const credentialOfferQrCode =
	"data:image/png;base64,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";

describe("credential offer endpoint", () => {
	it("returns an error with a bad scope", async () => {
		const scope = "bad:scope";
		const response = await request(app).get(`/offer/${scope}`);

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "bad_request",
			error_description: "Invalid scope",
		});
	});

	[
		"ehic",
		"diploma",
		"pid:jpt_dc",
		"pid:mso_mdoc",
		"pid:sd_jwt_dc",
		"pid:sd_jwt_dc:arf_1_5",
		"pid:sd_jwt_vc:arf_1_5",
		"pid:sd_jwt_vc",
		"por:sd_jwt_vc",
	].forEach((scope) => {
		it("WIP returns", async () => {
			const response = await request(app).get(`/offer/${scope}`);

			expect(response.status).toBe(404);
			expect(response.body).to.deep.eq({
				error: "invalid_request",
				error_description: "credential not supported by the issuer",
			});
		});
	});

	it("returns an error when credential not found", async () => {
		const scope = "not_found:scope";
		const response = await request(app).get(`/offer/${scope}`);

		expect(response.status).toBe(404);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "credential not supported by the issuer",
		});
	});

	it("returns a credential offer", async () => {
		const scope = "minimal:scope";
		const response = await request(app).get(`/offer/${scope}`);

		expect(response.status).toBe(200);
		expect(response.body).to.deep.eq({
			credentialOfferQrCode,
			credentialOfferUrl:
				"http://localhost:3000/?credential_offer=%7B%22credential_issuer%22%3A%22http%3A%2F%2Flocalhost%3A5000%22%2C%22credential_configuration_ids%22%3A%5B%22minimal%22%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%22issuer_state%22%3A%22issuer_state%22%7D%7D%7D",
			supportedCredentialType: {
				credential_signing_alg_values_supported: ["ES256"],
				cryptographic_binding_methods_supported: ["jwk"],
				display: [],
				format: "dc+sd-jwt",
				proof_types_supported: {
					jwt: {
						proof_signing_alg_values_supported: ["ES256"],
					},
				},
				scope: "minimal:scope",
				vct: "urn:test:minimal",
			},
		});
	});
});
