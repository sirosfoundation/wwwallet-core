import { jwtVerify, SignJWT } from "jose";
import { assert, describe, expect, it } from "vitest";
import type { PresentationCredential } from "../../src";
import { OauthError } from "../../src/errors";
import { generatePresentationHandlerFactory } from "../../src/handlers";

describe("generatePresentationHandler", () => {
	const vpTokenSecret = new TextEncoder().encode("secret");
	const presentation_request = {
		client_id: "client_id",
		response_uri: "response_uri",
		response_type: "response_type",
		response_mode: "response_mode",
		nonce: "nonce",
		state: "state",
		dcql_query: "dcql_query",
		scope: "scope",
	};
	const config = {
		vpTokenSigner: {
			sign: async (payload: Record<string, Array<string>>) => {
				return await new SignJWT(payload)
					.setProtectedHeader({ alg: "HS256" })
					.sign(vpTokenSecret);
			},
		},
	};
	const generatePresentationHandler =
		generatePresentationHandlerFactory(config);

	it("resolves with empty presentation credentials", async () => {
		const presentation_credentials: Array<PresentationCredential> = [];

		const response = await generatePresentationHandler({
			presentation_request,
			presentation_credentials,
		});

		expect(response).to.deep.eq({
			data: {
				presentation_request,
				vp_token:
					"eyJhbGciOiJIUzI1NiJ9.e30.XmNK3GpH3Ys_7wsYBfq4C3M6goz71I7dTgUkuIa5lyQ",
			},
			nextStep: "send_presentation",
			protocol: "oid4vp",
		});

		const { payload } = await jwtVerify(response.data.vp_token, vpTokenSecret);

		expect(payload).to.deep.eq({});
	});

	it("resolves with presentation credentials", async () => {
		const presentation_credentials: Array<PresentationCredential> = [
			{
				credential: "credential",
				credential_id: "credential_id",
			},
		];

		const response = await generatePresentationHandler({
			presentation_request,
			presentation_credentials,
		});

		expect(response).to.deep.eq({
			data: {
				presentation_request,
				vp_token:
					"eyJhbGciOiJIUzI1NiJ9.eyJjcmVkZW50aWFsX2lkIjpbImNyZWRlbnRpYWwiXX0.qMo0az-o1HFLi1zBibemaEDhbf6QuL0sgsEmNfw-pow",
			},
			nextStep: "send_presentation",
			protocol: "oid4vp",
		});

		const { payload } = await jwtVerify(response.data.vp_token, vpTokenSecret);

		expect(payload).to.deep.eq({
			credential_id: ["credential"],
		});
	});

	describe("vp token signer rejects", () => {
		const config = {
			vpTokenSigner: {
				sign: async (
					_payload: Record<string, Array<string>>,
				): Promise<string> => {
					throw new Error("rejects");
				},
			},
		};
		const generatePresentationHandler =
			generatePresentationHandlerFactory(config);

		it("rejects", async () => {
			const presentation_credentials: Array<PresentationCredential> = [];

			try {
				await generatePresentationHandler({
					presentation_request,
					presentation_credentials,
				});

				assert(false);
			} catch (error) {
				if (!(error instanceof OauthError)) {
					throw error;
				}

				expect(error.error).to.eq("invalid_client");
				expect(error.error_description).to.eq("could not sign vp token");
				expect(error.data).to.deep.eq({
					currentStep: "generate_presentation",
					error: new Error("rejects"),
					nextStep: "send_presentation",
					protocol: "oid4vp",
				});
			}
		});
	});
});
