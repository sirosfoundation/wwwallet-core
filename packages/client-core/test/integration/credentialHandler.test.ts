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
				issuer,
			}),
		},
		clientStateStore: clientStateStoreMock({
			state,
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
				proofs,
				access_token,
				credential_configuration_id,
				state,
				currentStep: "credential_request",
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
				proofs,
				access_token,
				credential_configuration_id,
				state,
				currentStep: "credential_request",
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
				proofs,
				access_token,
				credential_configuration_id,
				state,
				currentStep: "credential_request",
				nextStep: "credential_success",
				protocol: "oid4vci",
			});
		}
	});

	it("rejects without credential endpoint in issuer metadata", async () => {
		const config = {
			httpClient: {
				post: httpClientPostMock(),
				get: fetchIssuerMetadataMock({
					issuer,
				}),
			},
			clientStateStore: clientStateStoreMock({
				state,
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
				proofs,
				access_token,
				credential_configuration_id,
				state,
				currentStep: "credential_request",
				nextStep: "credential_success",
				protocol: "oid4vci",
			});
		}
	});

	it("rejects when credential request rejects", async () => {
		const credential_configuration_id = "credential_configuration_id";

		const config = {
			httpClient: {
				// @ts-ignore
				post: async (..._params) => {
					throw new Error("rejected");
				},
				get: fetchIssuerMetadataMock({
					issuer,
					credential_endpoint: new URL("/credential", issuer).toString(),
					credential_configurations_supported: {
						[credential_configuration_id]: {
							format: "format",
						},
					},
				}),
			},
			clientStateStore: clientStateStoreMock({
				state,
			}),
			dpop_ttl_seconds: 10,
		};

		const credentialHandler = credentialHandlerFactory(config);
		const access_token = "access_token";
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
				proofs,
				access_token,
				credential_configuration_id,
				state,
				currentStep: "credential_request",
				error: new Error("rejected"),
				nextStep: "credential_success",
				protocol: "oid4vci",
			});
		}
	});

	it("rejects when supported credential configurations are missing", async () => {
		const credentials = [{ credential: "credential" }];
		const credential_configuration_id = "credential_configuration_id";

		const config = {
			httpClient: {
				post: httpClientPostMock({ credentials }),
				get: fetchIssuerMetadataMock({
					issuer,
					credential_endpoint: new URL("/credential", issuer).toString(),
				}),
			},
			clientStateStore: clientStateStoreMock({
				state,
			}),
			dpop_ttl_seconds: 10,
		};

		const credentialHandler = credentialHandlerFactory(config);
		const access_token = "access_token";
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
				"credential configurations supported is missing in issuer metadata",
			);
			expect(error.data).to.deep.eq({
				proofs,
				access_token,
				credential_configuration_id,
				state,
				currentStep: "credential_request",
				nextStep: "credential_success",
				protocol: "oid4vci",
			});
		}
	});

	it("rejects when credential configuration id is missing from supported credential configurations", async () => {
		const credentials = [{ credential: "credential" }];
		const credential_configuration_id = "invalid_id";

		const config = {
			httpClient: {
				post: httpClientPostMock({ credentials }),
				get: fetchIssuerMetadataMock({
					issuer,
					credential_endpoint: new URL("/credential", issuer).toString(),
					credential_configurations_supported: {
						credential_configuration_id: {
							format: "format",
						},
					},
				}),
			},
			clientStateStore: clientStateStoreMock({
				state,
			}),
			dpop_ttl_seconds: 10,
		};

		const credentialHandler = credentialHandlerFactory(config);
		const access_token = "access_token";
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
				"credential_configuration_id 'invalid_id' is not present in credential configurations supported",
			);
			expect(error.data).to.deep.eq({
				proofs,
				access_token,
				credential_configuration_id,
				state,
				currentStep: "credential_request",
				nextStep: "credential_success",
				protocol: "oid4vci",
			});
		}
	});

	it("resolves with a successful credential request", async () => {
		const credentials = [{ credential: "credential" }];
		const credential_configuration_id = "credential_configuration_id";

		const config = {
			httpClient: {
				post: httpClientPostMock({ credentials }),
				get: fetchIssuerMetadataMock({
					issuer,
					credential_endpoint: new URL("/credential", issuer).toString(),
					credential_configurations_supported: {
						[credential_configuration_id]: {
							format: "format",
						},
					},
				}),
			},
			clientStateStore: clientStateStoreMock({
				state,
			}),
			dpop_ttl_seconds: 10,
		};

		const credentialHandler = credentialHandlerFactory(config);
		const access_token = "access_token";
		const proofs = {};

		const response = await credentialHandler({
			state,
			access_token,
			credential_configuration_id,
			proofs,
		});

		expect(response).to.deep.eq({
			data: {
				credentials: [
					{
						credential: "credential",
						format: "format",
					},
				],
			},
			nextStep: "credential_success",
			protocol: "oid4vci",
		});
	});
});
