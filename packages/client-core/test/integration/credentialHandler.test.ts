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
				credential_endpoint: new URL("/credential", issuer).toString(),
			},
		}),
		dpop_ttl_seconds: 10,
	};

	const credentialHandler = credentialHandlerFactory(config);

	it("rejects", async () => {
		const state = "";
		const access_token = "";
		const credential_configuration_id = "";
		const proofs = {};
		try {
			await credentialHandler({
				state,
				access_token,
				credential_configuration_id,
				proofs,
			});

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
		const credential_configuration_id = "";
		const proofs = {};

		try {
			await credentialHandler({
				state,
				access_token,
				credential_configuration_id,
				proofs,
			});

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_parameters");
			expect(error.error_description).to.eq("access token is missing");
			expect(error.data).to.deep.eq({
				nextStep: "credential_success",
				protocol: "oid4vci",
			});
		}
	});

	it("rejects with an access token", async () => {
		const access_token = "access_token";
		const credential_configuration_id = "";
		const proofs = {};

		try {
			await credentialHandler({
				state,
				access_token,
				credential_configuration_id,
				proofs,
			});

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_parameters");
			expect(error.error_description).to.eq(
				"credential configuration id is missing",
			);
			expect(error.data).to.deep.eq({
				nextStep: "credential_success",
				protocol: "oid4vci",
			});
		}
	});

	it("rejects without credential endpoint in issuer metadata", async () => {
		const config = {
			httpClient: {
				post: httpClientPostMock(),
				get: fetchIssuerMetadataMock({}),
			},
			clientStateStore: clientStateStoreMock({
				state,
				issuer_metadata: {
					issuer,
				},
			}),
			dpop_ttl_seconds: 10,
		};

		const credentialHandler = credentialHandlerFactory(config);
		const access_token = "access_token";
		const credential_configuration_id = "credential_configuration_id";
		const proofs = {};

		try {
			await credentialHandler({
				state,
				access_token,
				credential_configuration_id,
				proofs,
			});

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_parameters");
			expect(error.error_description).to.eq(
				"credential endpoint is missing in issuer metadata",
			);
			expect(error.data).to.deep.eq({
				nextStep: "credential_success",
				protocol: "oid4vci",
			});
		}
	});

	it("rejects when credential request rejects", async () => {
		const config = {
			httpClient: {
				// @ts-ignore
				post: async (..._params: any[]) => {
					throw new Error("rejected");
				},
				get: fetchIssuerMetadataMock({}),
			},
			clientStateStore: clientStateStoreMock({
				state,
				issuer_metadata: {
					issuer,
					credential_endpoint: new URL("/credential", issuer).toString(),
				},
			}),
			dpop_ttl_seconds: 10,
		};

		const credentialHandler = credentialHandlerFactory(config);
		const access_token = "access_token";
		const credential_configuration_id = "credential_configuration_id";
		const proofs = {};

		try {
			await credentialHandler({
				state,
				access_token,
				credential_configuration_id,
				proofs,
			});

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_request");
			expect(error.error_description).to.eq("could not fetch credential");
			expect(error.data).to.deep.eq({
				error: new Error("rejected"),
				nextStep: "credential_success",
				protocol: "oid4vci",
			});
		}
	});

	it("resolves with a successful credential request", async () => {
		const credentials = ["credential"];
		const config = {
			httpClient: {
				post: httpClientPostMock({ credentials }),
				get: fetchIssuerMetadataMock({}),
			},
			clientStateStore: clientStateStoreMock({
				state,
				issuer_metadata: {
					issuer,
					credential_endpoint: new URL("/credential", issuer).toString(),
				},
			}),
			dpop_ttl_seconds: 10,
		};

		const credentialHandler = credentialHandlerFactory(config);
		const access_token = "access_token";
		const credential_configuration_id = "credential_configuration_id";
		const proofs = {};

		const response = await credentialHandler({
			state,
			access_token,
			credential_configuration_id,
			proofs,
		});

		expect(response).to.deep.eq({
			data: {
				credentials: ["credential"],
			},
			nextStep: "credential_success",
			protocol: "oid4vci",
		});
	});
});
