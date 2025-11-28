import { assert, describe, expect, it } from "vitest";
import { OauthError } from "../../src";
import { deferredCredentialHandlerFactory } from "../../src/handlers";
import {
	clientStateStoreMock,
	fetchIssuerMetadataMock,
	httpClientPostMock,
} from "../support/client";

describe("credentialHandler", () => {
	const issuer = "http://issuer.url";
	const state = "state";
	const access_token = "access_token";

	it("rejects without deferred credential endpoint in issuer metadata", async () => {
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

		const credentialHandler = deferredCredentialHandlerFactory(config);
		const deferred_credential = {
			client_state: await config.clientStateStore.fromState(state),
			transaction_id: "transaction_id",
			interval: 60,
		};

		try {
			await credentialHandler({
				access_token,
				deferred_credential,
			});

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}

			expect(error.error).to.eq("invalid_parameters");
			expect(error.error_description).to.eq(
				"deferred credential endpoint is missing in issuer metadata",
			);
			expect(error.data).toMatchObject({
				currentStep: "deferred_credentials",
				deferred_credential: {
					client_state: {
						code_verifier: "code_verifier",
						dpopKeyPair: {
							privateKey: {
								alg: "ES256",
							},
							publicKey: {},
						},
						issuer: "http://issuer.url",
						issuer_state: "issuer_state",
						state: "state",
					},
					transaction_id: "transaction_id",
				},
				nextStep: "deferred_credentials_success",
				protocol: "oid4vci",
			});
		}
	});

	it("resolves when deferred credential request rejects", async () => {
		const config = {
			httpClient: {
				// @ts-ignore
				post: async (..._params) => {
					throw new Error("rejected");
				},
				get: fetchIssuerMetadataMock({
					issuer,
					deferred_credential_endpoint: new URL(
						"/deferred-credential",
						issuer,
					).toString(),
				}),
			},
			clientStateStore: clientStateStoreMock({
				state,
			}),
			dpop_ttl_seconds: 10,
		};

		const deferred_credential = {
			client_state: await config.clientStateStore.fromState(state),
			transaction_id: "transaction_id",
			interval: 60,
		};

		const credentialHandler = deferredCredentialHandlerFactory(config);

		try {
			await credentialHandler({
				access_token,
				deferred_credential,
			});

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}

			expect(error.error).to.eq("invalid_request");
			expect(error.error_description).to.eq(
				"could not fetch deferred credential",
			);
			expect(error.data).toMatchObject({
				currentStep: "deferred_credentials",
				deferred_credential: {
					client_state: {
						code_verifier: "code_verifier",
						dpopKeyPair: {
							privateKey: {
								alg: "ES256",
							},
							publicKey: {},
						},
						issuer: "http://issuer.url",
						issuer_state: "issuer_state",
						state: "state",
					},
					transaction_id: "transaction_id",
				},
				error: new Error("rejected"),
				nextStep: "deferred_credentials_success",
				protocol: "oid4vci",
			});
		}
	});

	it("resolves when deferred credential request returns credentials", async () => {
		const config = {
			httpClient: {
				// @ts-ignore
				post: async <T>(..._params) => {
					return { data: { credentials: [{ credential: "credential" }] } } as T;
				},
				get: fetchIssuerMetadataMock({
					issuer,
					deferred_credential_endpoint: new URL(
						"/deferred-credential",
						issuer,
					).toString(),
				}),
			},
			clientStateStore: clientStateStoreMock({
				state,
			}),
			dpop_ttl_seconds: 10,
		};

		const deferred_credential = {
			client_state: await config.clientStateStore.fromState(state),
			transaction_id: "transaction_id",
			interval: 60,
		};

		const credentialHandler = deferredCredentialHandlerFactory(config);

		const response = await credentialHandler({
			access_token,
			deferred_credential,
		});

		expect(response).to.deep.eq({
			data: {
				credentials: [{ credential: "credential" }],
				deferred_credential,
			},
			nextStep: "deferred_credentials_success",
			protocol: "oid4vci",
		});
	});
});
