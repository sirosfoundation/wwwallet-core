import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../support/app";

describe("well-known endpoints", () => {
	it("oauth-authorization-server", async () => {
		const response = await request(app).get(
			"/.well-known/oauth-authorization-server",
		);

		expect(response.status).toBe(200);
		expect(response.body).to.deep.eq({
			authorization_challenge_endpoint:
				"http://localhost:5000/authorization-challenge",
			authorization_endpoint: "http://localhost:5000/authorize",
			code_challenge_methods_supported: ["S256"],
			dpop_signing_alg_values_supported: ["ES256"],
			grant_types_supported: ["authorization_code", "refresh_token"],
			issuer: "http://localhost:5000",
			jwks_uri: "http://localhost:5000/jwks",
			pushed_authorization_request_endpoint:
				"http://localhost:5000/pushed-authorization-request",
			require_pushed_authorization_requests: true,
			response_types_supported: ["code"],
			scopes_supported: ["not_found:scope", "minimal:scope", "client:scope"],
			token_endpoint: "http://localhost:5000/token",
			token_endpoint_auth_methods_supported: ["none"],
		});
	});

	it("openid-credential-issuer", async () => {
		const response = await request(app).get(
			"/.well-known/openid-credential-issuer",
		);

		expect(response.status).toBe(200);
		expect(response.body).to.deep.eq({
			credential_endpoint: "http://localhost:5000/credential",
			credential_issuer: "http://localhost:5000",
			nonce_endpoint: "http://localhost:5000/nonce",
			credential_configurations_supported: {
				minimal: {
					format: "dc+sd-jwt",
					vct: "urn:test:minimal",
					scope: "minimal:scope",
					display: [
						{
							background_color: "#00246b",
							background_image: {
								uri: "http://background.uri",
							},
							description: "A minimal credential for testing purposes",
							locale: "en-US",
							name: "Minimal",
							text_color: "#ffffff",
						},
					],
					credential_signing_alg_values_supported: ["ES256"],
					cryptographic_binding_methods_supported: ["jwk"],
					proof_types_supported: {
						attestation: {
							key_attestations_required: {},
							proof_signing_alg_values_supported: ["ES256"],
						},
						jwt: {
							proof_signing_alg_values_supported: ["ES256"],
						},
					},
				},
			},
		});
	});
});
