import { assert, describe, expect, it } from "vitest";
import { OauthError } from "../../src";
import { credentialHandlerFactory } from "../../src/handlers";
import {
	clientStateStoreMock,
	fetchIssuerMetadataMock,
	httpClientPostMock,
} from "../support/client";

describe("credentialHandler", () => {
	const issuer = "http://issuer.url";
	const state = "state";
	const config = {
		httpClient: {
			post: httpClientPostMock(),
			get: fetchIssuerMetadataMock({
				credential_endpoint: new URL("/credential", issuer).toString(),
			}),
		},
		clientStateStore: clientStateStoreMock({
			state,
			issuer_metadata: {
				issuer,
			},
		}),
		static_clients: [
			{
				client_id: "id",
				client_secret: "secret",
				issuer,
			},
		],
		dpop_ttl_seconds: 10,
	};

	const credentialHandler = credentialHandlerFactory(config);

	it("rejects", async () => {
		const state = "";
		const access_token = "";
		try {
			await credentialHandler({ state, access_token });

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_client");
			expect(error.error_description).to.eq("client state could not be found");
			expect(error.data).to.deep.eq({
				nextStep: "credential_success",
				protocol: "oid4vci",
			});
		}
	});

	it("rejects with a known client state", async () => {
		const access_token = "";
		const response = await credentialHandler({ state, access_token });

		expect(response.protocol).to.eq("oid4vci");
		expect(response.nextStep).to.eq("credential_success");
		assert(response.data?.dpop);
	});
});
