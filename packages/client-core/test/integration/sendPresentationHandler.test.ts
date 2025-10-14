import { assert, describe, expect, it } from "vitest";
import { OauthError } from "../../src/errors";
import { sendPresentationHandlerFactory } from "../../src/handlers";
import { fetchIssuerMetadataMock, httpClientPostMock } from "../support/client";

describe("sendPresentation", () => {
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
	const redirect_uri = "http://redirect.uri";
	const config = {
		httpClient: {
			post: httpClientPostMock({ redirect_uri }),
			get: fetchIssuerMetadataMock({}),
		},
	};
	const sendPresentation = sendPresentationHandlerFactory(config);

	it("resolves with empty presentation credentials", async () => {
		const vp_token = "vp_token";

		const response = await sendPresentation({
			presentation_request,
			vp_token,
		});

		expect(response).to.deep.eq({
			data: {
				redirect_uri,
			},
			nextStep: "presentation_success",
			protocol: "oid4vp",
		});
	});

	describe("post presentation response rejects", () => {
		const vp_token = "vp_token";
		const config = {
			httpClient: {
				post: async <T>(url: string, body: unknown): Promise<{ data: T }> => {
					expect(url).to.eq(presentation_request.response_uri);
					expect(body).to.deep.eq({
						vp_token,
						state: presentation_request.state,
					});
					throw new Error("reject");
				},
				get: fetchIssuerMetadataMock({}),
			},
		};
		const sendPresentation = sendPresentationHandlerFactory(config);

		it("resolves with empty presentation credentials", async () => {
			try {
				await sendPresentation({
					presentation_request,
					vp_token,
				});

				assert(false);
			} catch (error) {
				if (!(error instanceof OauthError)) {
					throw error;
				}

				expect(error.error).to.eq("invalid_request");
				expect(error.error_description).to.eq(
					"could not perform presentation response",
				);
				expect(error.data).to.deep.eq({
					currentStep: "send_presentation",
					error: new Error("reject"),
					nextStep: "presentation_success",
					protocol: "oid4vp",
				});
			}
		});
	});
});
