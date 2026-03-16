import { describe, expect, it } from "vitest";
import { OauthError } from "../../src/errors";
import { validateDpop } from "../../src/statements/validations/validateDpop";

describe("validateDpop", () => {
	it("rejects comma-separated dpop value", async () => {
		await expect(
			validateDpop(
				{
					token_type: "DPoP",
					access_token: "access-token",
					dpop: "proof-1,proof-2",
					dpopRequest: {
						method: "POST",
						uri: "/credential",
					},
				},
				{
					issuer_url: "http://localhost:5000",
				},
			),
		).rejects.toEqual(
			new OauthError(
				400,
				"invalid_request",
				"no more than one dpop value is accepted",
			),
		);
	});

	it("accepts lowercase dpop token type", async () => {
		await expect(
			validateDpop(
				{
					token_type: "dpop",
					access_token: "access-token",
					dpop: "not-a-jwt",
					dpopRequest: {
						method: "POST",
						uri: "/credential",
					},
				},
				{
					issuer_url: "http://localhost:5000",
				},
			),
		).rejects.toEqual(
			new OauthError(400, "invalid_request", "dpop jwt header is invalid"),
		);
	});
});
