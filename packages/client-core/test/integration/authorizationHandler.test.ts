import { afterEach, assert, describe, expect, it } from "vitest";
import { OauthError } from "../../src/errors";
import { authorizationHandlerFactory } from "../../src/handlers";
import {
	clientStateStoreMock,
	fetchIssuerMetadataMock,
} from "../support/client";

describe("authorizationRequestHandler - pushed authorization requests", () => {
	const issuer = "http://issuer.url";
	let lastRequest: {
		url: string;
		body: unknown;
		config: unknown;
	} | null = null;
	const config = {
		wallet_callback_url: "http://wallet.url",
		httpClient: {
			post: async <T>(
				url: string,
				body?: unknown,
				config?: { headers: Record<string, string> },
			) => {
				// @ts-ignore
				lastRequest = { url, body, config };
				return { data: { request_uri: url } as T };
			},
			get: fetchIssuerMetadataMock({
				issuer,
				authorization_endpoint: new URL("/authorize", issuer).toString(),
				pushed_authorization_request_endpoint: new URL(
					"/par",
					issuer,
				).toString(),
				credential_configurations_supported: {
					id: { scope: "scope" },
				},
			}),
		},
		clientStateStore: clientStateStoreMock({
			state: "state",
			credential_configuration_ids: ["id"],
		}),
		static_clients: [
			{
				client_id: "id",
				client_secret: "secret",
				issuer,
			},
		],
	};
	afterEach(() => {
		lastRequest = null;
	});

	const authorizationRequestHandler = authorizationHandlerFactory(config);

	it("rejects when no clients are associated to the issuer", async () => {
		const issuer = "http://issuer.other";
		const issuer_state = "issuer_state";
		try {
			await authorizationRequestHandler({ issuer, issuer_state });

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}

			expect(error.error).to.eq("invalid_client");
			expect(error.data.currentStep).to.eq("authorization_request");
			expect(error.data.nextStep).to.eq("authorization_request");
			expect(error.error_description).to.eq("could not find issuer client");
		}
	});

	it("rejects with empty issuer state", async () => {
		const issuer_state = "";
		try {
			await authorizationRequestHandler({ issuer, issuer_state });

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}

			expect(error.error).to.eq("invalid_client");
			expect(error.data.currentStep).to.eq("authorization_request");
			expect(error.data.nextStep).to.eq("authorization_request");
			expect(error.error_description).to.eq("client state could not be found");
		}
	});

	it("resolves", async () => {
		const issuer_state = "issuer_state";
		const response = await authorizationRequestHandler({
			issuer,
			issuer_state,
		});

		// @ts-ignore
		expect(lastRequest).to.deep.eq({
			body: {
				response_type: "code",
				client_id: "id",
				issuer_state: "issuer_state",
				redirect_uri: "http://wallet.url",
				scope: "scope",
				state: "state",
				code_challenge: "73oehA2tBul5grZPhXUGQwNAjxh69zNES8bu2bVD0EM",
				code_challenge_method: "S256",
			},
			config: {
				headers: {},
			},
			url: "http://issuer.url/par",
		});
		expect(response).to.deep.eq({
			data: {
				authorize_url:
					"http://issuer.url/authorize?client_id=id&request_uri=http%3A%2F%2Fissuer.url%2Fpar",
			},
			nextStep: "authorize",
			protocol: "oid4vci",
		});
	});

	describe("when pushed authorization request is rejected", () => {
		const pushed_authorization_request_endpoint = new URL(
			"/par",
			issuer,
		).toString();
		const config = {
			wallet_callback_url: "http://wallet.url",
			httpClient: {
				post: async <T>(
					url: string,
					body?: unknown,
					config?: { headers: Record<string, string> },
				) => {
					lastRequest = { url, body, config };
					if (url.match(pushed_authorization_request_endpoint)) {
						throw new Error("rejected");
					}

					return { data: { request_uri: url } as T };
				},
				get: fetchIssuerMetadataMock({
					issuer,
					authorization_endpoint: new URL("/authorize", issuer).toString(),
					pushed_authorization_request_endpoint: new URL(
						"/par",
						issuer,
					).toString(),
					credential_configurations_supported: {},
				}),
			},
			clientStateStore: clientStateStoreMock(),
			static_clients: [
				{
					client_id: "id",
					client_secret: "secret",
					issuer,
				},
			],
		};
		const authorizationRequestHandler = authorizationHandlerFactory(config);

		it("rejects", async () => {
			const issuer_state = "issuer_state";
			try {
				await authorizationRequestHandler({ issuer, issuer_state });

				assert(false);
			} catch (error) {
				if (!(error instanceof OauthError)) {
					throw error;
				}

				expect(lastRequest).to.deep.eq({
					body: {
						response_type: "code",
						client_id: "id",
						issuer_state: "issuer_state",
						redirect_uri: "http://wallet.url",
						scope: "",
						state: "state",
						code_challenge: "73oehA2tBul5grZPhXUGQwNAjxh69zNES8bu2bVD0EM",
						code_challenge_method: "S256",
					},
					config: {
						headers: {},
					},
					url: "http://issuer.url/par",
				});
				expect(error.error).to.eq("invalid_issuer");
				expect(error.error_description).to.eq(
					"could not perform pushed authorization request",
				);
			}
		});
	});
});

describe("authorizationRequestHandler - authorization challenge", () => {
	const issuer = "http://issuer.url";
	const issuerMetadata = {
		issuer,
		authorization_endpoint: new URL("/authorize", issuer).toString(),
		authorization_challenge_endpoint: new URL(
			"/authorization_challenge",
			issuer,
		).toString(),
	};
	let lastRequest: {
		url: string;
		body: unknown;
		config: unknown;
	} | null = null;
	const config = {
		wallet_callback_url: "http://wallet.url",
		httpClient: {
			post: async <T>(
				url: string,
				body?: unknown,
				config?: { headers: Record<string, string> },
			) => {
				// @ts-ignore
				lastRequest = { url, body, config };
				return { data: { request_uri: url } as T };
			},
			get: fetchIssuerMetadataMock(issuerMetadata),
		},
		clientStateStore: clientStateStoreMock(),
		static_clients: [
			{
				client_id: "id",
				client_secret: "secret",
				issuer,
			},
		],
	};
	afterEach(() => {
		lastRequest = null;
	});

	const authorizationRequestHandler = authorizationHandlerFactory(config);

	it("resolves", async () => {
		const issuer_state = "issuer_state";
		const response = await authorizationRequestHandler({
			issuer,
			issuer_state,
		});

		// @ts-ignore
		expect(lastRequest).to.eq(null);
		expect(response).to.deep.eq({
			data: {
				issuer_metadata: {
					authorization_challenge_endpoint:
						"http://issuer.url/authorization_challenge",
					authorization_endpoint: "http://issuer.url/authorize",
					issuer: "http://issuer.url",
				},
			},
			nextStep: "authorization_challenge",
			protocol: "oid4vci",
		});
	});
});

describe("authorizationRequestHandler - no authorization method", () => {
	const issuer = "http://issuer.url";
	const issuerMetadata = {
		issuer,
		authorization_endpoint: new URL("/authorize", issuer).toString(),
	};
	const config = {
		wallet_callback_url: "http://wallet.url",
		httpClient: {
			post: async <T>(url: string) => {
				return { data: { request_uri: url } as T };
			},
			get: fetchIssuerMetadataMock(issuerMetadata),
		},
		clientStateStore: clientStateStoreMock(),
		static_clients: [
			{
				client_id: "id",
				client_secret: "secret",
				issuer,
			},
		],
	};

	const authorizationRequestHandler = authorizationHandlerFactory(config);

	it("rejects", async () => {
		const issuer_state = "issuer_state";
		try {
			await authorizationRequestHandler({
				issuer,
				issuer_state,
			});

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}

			expect(error.error).to.eq("invalid_request");
			expect(error.error_description).to.eq(
				"authorization method not supported",
			);
		}
	});
});
