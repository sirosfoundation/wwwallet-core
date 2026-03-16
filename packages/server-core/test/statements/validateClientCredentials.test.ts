import { decodeProtectedHeader, jwtVerify } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OauthError } from "../../src/errors";
import { validateClientCredentials } from "../../src/statements/validations/validateClientCredentials";
import { config } from "../support/app";

vi.mock("jose", () => ({
	decodeProtectedHeader: vi.fn(),
	jwtVerify: vi.fn(),
}));

describe("validateClientCredentials", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("rejects mismatched client_id and oauth client attestation subject", async () => {
		vi.mocked(decodeProtectedHeader).mockReturnValueOnce({
			typ: "oauth-client-attestation+jwt",
		} as never);
		vi.mocked(jwtVerify).mockResolvedValueOnce({
			payload: { sub: "id" },
		} as never);

		await expect(
			validateClientCredentials(
				{
					client_id: "other-client-id",
					redirect_uri: "http://redirect.uri",
					oauth_client_attestation: "attestation",
					confidential: false,
				},
				{
					clients: [
						{
							id: "id",
							redirect_uris: ["http://redirect.uri"],
							scopes: [],
						},
						{
							id: "other-client-id",
							redirect_uris: ["http://redirect.uri"],
							scopes: [],
						},
					],
					trusted_root_certificates: config.trusted_root_certificates,
				},
			),
		).rejects.toEqual(
			new OauthError(401, "invalid_client", "invalid client credentials"),
		);
	});

	it("rejects oauth client attestation with invalid typ header", async () => {
		vi.mocked(decodeProtectedHeader).mockReturnValueOnce({
			typ: "JWT",
		} as never);

		await expect(
			validateClientCredentials(
				{
					client_id: "id",
					redirect_uri: "http://redirect.uri",
					oauth_client_attestation: "attestation",
					confidential: false,
				},
				{
					clients: [
						{
							id: "id",
							redirect_uris: ["http://redirect.uri"],
							scopes: [],
						},
					],
					trusted_root_certificates: config.trusted_root_certificates,
				},
			),
		).rejects.toEqual(
			new OauthError(401, "invalid_client", "invalid client credentials"),
		);
	});

	it("rejects comma-separated oauth client attestation values", async () => {
		await expect(
			validateClientCredentials(
				{
					client_id: "id",
					redirect_uri: "http://redirect.uri",
					oauth_client_attestation: "attestation-1,attestation-2",
					confidential: false,
				},
				{
					clients: [
						{
							id: "id",
							redirect_uris: ["http://redirect.uri"],
							scopes: [],
						},
					],
					trusted_root_certificates: config.trusted_root_certificates,
				},
			),
		).rejects.toEqual(
			new OauthError(401, "invalid_client", "invalid client credentials"),
		);
	});

	it("rejects whitespace-only oauth client attestation values", async () => {
		await expect(
			validateClientCredentials(
				{
					client_id: "id",
					redirect_uri: "http://redirect.uri",
					oauth_client_attestation: "   ",
					confidential: false,
				},
				{
					clients: [
						{
							id: "id",
							redirect_uris: ["http://redirect.uri"],
							scopes: [],
						},
					],
					trusted_root_certificates: config.trusted_root_certificates,
				},
			),
		).rejects.toEqual(
			new OauthError(401, "invalid_client", "invalid client credentials"),
		);
	});
});
