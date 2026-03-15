import { jwtVerify } from "jose";
import { describe, expect, it, vi } from "vitest";
import { OauthError } from "../../src/errors";
import { validateClientCredentials } from "../../src/statements/validations/validateClientCredentials";
import { config } from "../support/app";

vi.mock("jose", () => ({
	jwtVerify: vi.fn(),
}));

describe("validateClientCredentials", () => {
	it("rejects mismatched client_id and oauth client attestation subject", async () => {
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
});
