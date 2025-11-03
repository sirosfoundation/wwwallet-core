import { decodeProtectedHeader, type JWK, jwtVerify, SignJWT } from "jose";
import { assert, describe, expect, it } from "vitest";
import { OauthError } from "../../src/errors";
import { locationHandlerFactory } from "../../src/handlers";
import {
	clientStateStoreMock,
	fetchIssuerMetadataMock,
	httpClientPostMock,
	presentationCredentialsStoreMock,
} from "../support/client";

const locationHandler = locationHandlerFactory({
	// @ts-ignore
	httpClient: {
		get: async <T>(_url: string) => {
			return { data: {} as T };
		},
	},
	clientStateStore: clientStateStoreMock(),
	wallet_callback_url: "http://redirect.uri",
	presentationCredentialsStore: presentationCredentialsStoreMock([
		{ credential: "credential" },
	]),
	dpop_ttl_seconds: 10,
	static_clients: [],
});

describe("location handler - no protocol", () => {
	it("returns", async () => {
		const location = {
			search: "",
		};

		// @ts-ignore
		const response = await locationHandler(location);

		expect(response.protocol).to.eq(null);
	});

	it("returns with invalid parameters", async () => {
		const location = {
			search: "param=invalid",
		};

		// @ts-ignore
		const response = await locationHandler(location);

		expect(response.protocol).to.eq(null);
	});
});

describe("location handler - protocol error", () => {
	it("returns", async () => {
		const error = "error";
		const location = {
			search: `error=${error}`,
		};

		// @ts-ignore
		const response = await locationHandler(location);
		expect(response.protocol).to.eq("oauth");
		if (response.protocol === "oauth") {
			expect(response.nextStep).to.eq("protocol_error");
			if (response.nextStep !== "protocol_error") {
				return assert(false);
			}
			expect(response.data.error).to.eq(error);
			expect(response.data.error_description).to.eq(null);
		}
	});

	it("returns with an error description", async () => {
		const error = "error";
		const error_description = "error_description";
		const location = {
			search: `error=${error}&error_description=${error_description}`,
		};

		// @ts-ignore
		const response = await locationHandler(location);
		expect(response.protocol).to.eq("oauth");
		if (response.protocol === "oauth") {
			expect(response.nextStep).to.eq("protocol_error");
			if (response.nextStep !== "protocol_error") {
				return assert(false);
			}
			expect(response.data.error).to.eq(error);
			expect(response.data.error_description).to.eq(error_description);
		}
	});
});

describe("location handler - authorization code", () => {
	const issuer = "http://issuer.url";

	it("rejects with no configuration", async () => {
		const code = "code";
		const state = "state";
		const location = {
			search: `?code=${code}&state=${state}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_client");
			expect(error.error_description).to.eq("could not find issuer client");
		}
	});

	it("rejects when issuer metadata cannot be retrieved", async () => {
		const locationHandler = locationHandlerFactory({
			// @ts-ignore
			httpClient: {
				get: async <T>(url: string) => {
					if (
						new URL(url).pathname === "/.well-known/openid-credential-issuer"
					) {
						throw new Error("rejected");
					}

					return { data: {} as T };
				},
			},
			clientStateStore: clientStateStoreMock({ issuer }),
			wallet_callback_url: "http://redirect.uri",
			dpop_ttl_seconds: 10,
			static_clients: [
				{
					client_id: "id",
					client_secret: "secret",
					issuer,
				},
			],
		});
		const code = "code";
		const state = "state";
		const location = {
			search: `?code=${code}&state=${state}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}

			expect(error.error).to.eq("invalid_issuer");
			expect(error.error_description).to.eq(
				"could not fetch issuer information",
			);
		}
	});

	it("rejects when issuer metadata is present in client state", async () => {
		const locationHandler = locationHandlerFactory({
			// @ts-ignore
			httpClient: {
				get: fetchIssuerMetadataMock({}),
			},
			clientStateStore: clientStateStoreMock({
				issuer,
			}),
			wallet_callback_url: "http://redirect.uri",
			dpop_ttl_seconds: 10,
			static_clients: [
				{
					client_id: "id",
					client_secret: "secret",
					issuer,
				},
			],
		});
		const code = "code";
		const state = "state";
		const location = {
			search: `?code=${code}&state=${state}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_request");
			expect(error.error_description).to.eq("could not fetch access token");
		}
	});

	it("rejects when access token request is a success", async () => {
		const lastRequest: Array<{
			url: string;
			body: unknown;
			config?: { headers: Record<string, string> };
		}> = [];
		const access_token = "access_token";
		const c_nonce = "c_nonce";
		const refresh_token = "refresh_token";
		const expires_in = 10;
		const c_nonce_expires_in = 10;

		const locationHandler = locationHandlerFactory({
			// @ts-ignore
			httpClient: {
				get: fetchIssuerMetadataMock({
					token_endpoint: "http://token.endpoint",
				}),
				post: async <T>(
					url: string,
					body: unknown,
					config?: { headers: Record<string, string> },
				) => {
					lastRequest.push({ url, body, config });
					if (url === "http://token.endpoint") {
						return {
							data: {
								access_token,
								expires_in,
								c_nonce,
								c_nonce_expires_in,
								refresh_token,
							} as T,
						};
					}

					throw new Error("not found");
				},
			},
			clientStateStore: clientStateStoreMock({
				issuer,
			}),
			wallet_callback_url: "http://redirect.uri",
			dpop_ttl_seconds: 10,
			static_clients: [
				{
					client_id: "id",
					client_secret: "secret",
					issuer,
				},
			],
		});
		const code = "code";
		const state = "state";
		const location = {
			search: `?code=${code}&state=${state}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_request");
			expect(error.error_description).to.eq("could not fetch nonce");
		}
	});

	it("resolves when nonce request is a success", async () => {
		const lastRequest: Array<{
			url: string;
			body: unknown;
			config?: { headers: Record<string, string> };
		}> = [];
		const token_type = "bearer";
		const access_token = "access_token";
		const c_nonce = "c_nonce";
		const refresh_token = "refresh_token";
		const expires_in = 10;
		const c_nonce_expires_in = 10;
		const redirect_uri = "http://redirect.uri";

		const config = {
			// @ts-ignore
			httpClient: {
				get: fetchIssuerMetadataMock({
					token_endpoint: "http://token.endpoint",
					nonce_endpoint: "http://nonce.endpoint",
				}),
				post: async <T>(
					url: string,
					body: unknown,
					config?: { headers: Record<string, string> },
				) => {
					lastRequest.push({ url, body, config });
					if (url === "http://token.endpoint") {
						return {
							data: {
								token_type,
								access_token,
								expires_in,
								refresh_token,
							} as T,
						};
					}

					if (url === "http://nonce.endpoint") {
						return { data: { c_nonce, c_nonce_expires_in } as T };
					}

					throw new Error("not found");
				},
			},
			clientStateStore: clientStateStoreMock({
				issuer,
			}),
			wallet_callback_url: redirect_uri,
			dpop_ttl_seconds: 10,
			static_clients: [
				{
					client_id: "id",
					client_secret: "secret",
					issuer,
				},
			],
		};
		const locationHandler = locationHandlerFactory(config);
		const code = "code";
		const state = "state";
		const location = {
			search: `?code=${code}&state=${state}`,
		};

		// @ts-ignore
		const response = await locationHandler(location);

		// token request
		// @ts-ignore
		expect(lastRequest[0].url).to.eq("http://token.endpoint");
		// @ts-ignore
		expect(lastRequest[0].body).to.deep.eq({
			client_id: "id",
			client_secret: "secret",
			code_verifier: "code_verifier",
			code: "code",
			grant_type: "authorization_code",
			redirect_uri: "http://redirect.uri",
		});

		// @ts-ignore
		const accessTokenDpop = lastRequest[0].config.headers.DPoP;
		const { jwk: accessTokenDpopJwk } = decodeProtectedHeader(accessTokenDpop);
		const { payload: accessTokenDpopPayload } = await jwtVerify(
			accessTokenDpop,
			accessTokenDpopJwk as JWK,
		);

		assert(accessTokenDpopPayload.exp);
		expect(accessTokenDpopPayload.htu).to.eq("http://token.endpoint");
		expect(accessTokenDpopPayload.htm).to.eq("POST");
		assert(accessTokenDpopPayload.iat);
		assert(accessTokenDpopPayload.jti);

		// nonce request
		// @ts-ignore
		expect(lastRequest[1].url).to.eq("http://nonce.endpoint");
		// @ts-ignore
		expect(lastRequest[1].body).to.deep.eq({});

		// @ts-ignore
		const nonceDpop = lastRequest[1].config.headers.DPoP;
		const { jwk: nonceDpopJwk } = decodeProtectedHeader(nonceDpop);
		const { payload: nonceDpopPayload } = await jwtVerify(
			nonceDpop,
			nonceDpopJwk as JWK,
		);

		assert(nonceDpopPayload.exp);
		expect(nonceDpopPayload.htm).to.eq("http://nonce.endpoint");
		expect(nonceDpopPayload.htu).to.eq("POST");
		assert(nonceDpopPayload.iat);
		assert(nonceDpopPayload.jti);

		expect(response).toMatchObject({
			data: {
				issuer_metadata: {},
				state,
				client_state: {
					code_verifier: "code_verifier",
					issuer: "http://issuer.url",
					issuer_state: "issuer_state",
					state: "state",
				},
				token_type,
				access_token,
				c_nonce,
				c_nonce_expires_in,
				expires_in,
				refresh_token,
			},
			nextStep: "credential_request",
			protocol: "oid4vci",
		});
	});
});

describe("location handler - presentation success", () => {
	it("returns", async () => {
		const code = "code";
		const location = {
			search: `code=${code}`,
		};

		// @ts-ignore
		const response = await locationHandler(location);

		expect(response.protocol).to.eq("oid4vp");
		if (!response.protocol) {
			return assert(false);
		}
		expect(response.nextStep).to.eq("presentation_success");
		if (response.nextStep === "presentation_success") {
			return expect(response.data.code).to.eq(code);
		}
		assert(false);
	});
});

describe("location handler - credential offer", () => {
	const config = {
		httpClient: {
			get: fetchIssuerMetadataMock({}),
			post: httpClientPostMock(),
		},
		clientStateStore: clientStateStoreMock(),
		static_clients: [
			{
				issuer: "http://issuer.url",
				client_id: "client_id",
				client_secret: "client_secret",
			},
		],
		wallet_callback_url: "http://redirect.uri",
		dpop_ttl_seconds: 10,
	};
	const locationHandler = locationHandlerFactory(config);

	it("rejects with an invalid credential offer", async () => {
		const credential_offer = "invalid";
		const location = {
			search: `?credential_offer=${credential_offer}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"credential offer could not be parsed",
			);
		}
	});

	it("rejects with an invalid credential offer (empty)", async () => {
		const credential_offer = {};
		const location = {
			search: `?credential_offer=${JSON.stringify(credential_offer)}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"credential offer must contain a credential issuer parameter",
			);
		}
	});

	it("rejects with an invalid credential offer (credential_issuer)", async () => {
		const credential_issuer = "credential_issuer";
		const credential_offer = {
			credential_issuer,
		};
		const location = {
			search: `?credential_offer=${JSON.stringify(credential_offer)}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"credential offer must contain a credential configuration ids parameter",
			);
		}
	});

	it("rejects with an invalid credential offer (credential_configuration_ids)", async () => {
		const credential_issuer = "credential_issuer";
		const credential_configuration_ids = "invalid";
		const credential_offer = {
			credential_issuer,
			credential_configuration_ids,
		};
		const location = {
			search: `?credential_offer=${JSON.stringify(credential_offer)}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"credential offer credential configuration ids parameter is invalid",
			);
		}
	});

	it("rejects without grants", async () => {
		const credential_issuer = "https://issuer.url/";
		const credential_configuration_ids = ["credential_configuration_ids"];
		const credential_offer = {
			credential_issuer,
			credential_configuration_ids,
		};
		const location = {
			search: `?credential_offer=${JSON.stringify(credential_offer)}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq("grants parameter is required");
		}
	});

	it("rejects with empty grants", async () => {
		const credential_issuer = "https://issuer.url/";
		const credential_configuration_ids = ["credential_configuration_ids"];
		const grants = {};
		const credential_offer = {
			credential_issuer,
			credential_configuration_ids,
			grants,
		};
		const location = {
			search: `?credential_offer=${JSON.stringify(credential_offer)}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"given authorization grants are not supported",
			);
		}
	});

	it("rejects with an invalid grants", async () => {
		const credential_issuer = "https://issuer.url/";
		const credential_configuration_ids = ["credential_configuration_ids"];
		const grants = { invalid: true };
		const credential_offer = {
			credential_issuer,
			credential_configuration_ids,
			grants,
		};
		const location = {
			search: `?credential_offer=${JSON.stringify(credential_offer)}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"given authorization grants are not supported",
			);
		}
	});

	it("rejects with an invalid authorization code grants", async () => {
		const credential_issuer = "https://issuer.url/";
		const credential_configuration_ids = ["credential_configuration_ids"];
		const grants = { authorization_code: null };
		const credential_offer = {
			credential_issuer,
			credential_configuration_ids,
			grants,
		};
		const location = {
			search: `?credential_offer=${JSON.stringify(credential_offer)}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"given authorization grants are not supported",
			);
		}
	});

	it("returns with a valid authorization code grants", async () => {
		const credential_issuer = "https://issuer.url/";
		const credential_configuration_ids = ["credential_configuration_ids"];
		const grants = { authorization_code: {} };
		const credential_offer = {
			credential_issuer,
			credential_configuration_ids,
			grants,
		};
		const location = {
			search: `?credential_offer=${JSON.stringify(credential_offer)}`,
		};

		// @ts-ignore
		const response = await locationHandler(location);

		expect(response.protocol).to.eq("oid4vci");
		if (response.protocol !== "oid4vci") {
			assert(false);
		}
		expect(response.nextStep).to.eq("authorization_request");
		if (response.nextStep !== "authorization_request") {
			assert(false);
		}
		expect(response.data?.issuer).to.eq(credential_issuer);
		expect(response.data?.credential_configuration_ids).to.deep.eq(
			credential_configuration_ids,
		);
	});

	it("returns with a valid authorization code grants (issuer_state)", async () => {
		const credential_issuer = "https://issuer.url/";
		const credential_configuration_ids = ["credential_configuration_ids"];
		const issuer_state = "issuer_state";
		const grants = { authorization_code: { issuer_state } };
		const credential_offer = {
			credential_issuer,
			credential_configuration_ids,
			grants,
		};
		const location = {
			search: `?credential_offer=${JSON.stringify(credential_offer)}`,
		};

		// @ts-ignore
		const response = await locationHandler(location);

		// @ts-ignore
		delete config.clientStateStore._clientState.dpopKeyPair;
		expect(config.clientStateStore._clientState).to.deep.eq({
			state: "state",
			code_verifier: "code_verifier",
			credential_configuration_ids: ["credential_configuration_ids"],
			issuer: "https://issuer.url/",
			issuer_state: "issuer_state",
		});
		expect(response.protocol).to.eq("oid4vci");
		if (response.protocol !== "oid4vci") {
			assert(false);
		}
		expect(response.nextStep).to.eq("authorization_request");
		if (response.nextStep !== "authorization_request") {
			assert(false);
		}
		expect(response.data?.issuer).to.eq(credential_issuer);
		expect(response.data?.credential_configuration_ids).to.deep.eq(
			credential_configuration_ids,
		);
		expect(response.data?.issuer_state).to.deep.eq(issuer_state);
	});
});

describe("location handler - presentation request", () => {
	it("rejects with query parameters", async () => {
		const client_id = "client_id";
		const response_uri = "response_uri";
		const response_type = "response_type";
		const response_mode = "response_mode";
		const nonce = "nonce";
		const state = "state";
		const location = {
			search: `?client_id=${client_id}&response_uri=${response_uri}&response_type=${response_type}&response_mode=${response_mode}&nonce=${nonce}&state=${state}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"response uri parameter is missing",
			);
		}
	});

	it("rejects with invalid request", async () => {
		const client_id = "client_id";
		const request = "invalid";
		const location = {
			search: `?client_id=${client_id}&request=${request}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"could not parse presentation request",
			);
		}
	});

	it("resolves a presentation request with request", async () => {
		const client_id = "client_id";
		const response_uri = "response_uri";
		const response_type = "response_type";
		const response_mode = "response_mode";
		const nonce = "nonce";
		const state = "state";

		const request = await new SignJWT({
			client_id,
			response_uri,
			response_type,
			response_mode,
			nonce,
			state,
		})
			.setProtectedHeader({ alg: "HS256" })
			.sign(new TextEncoder().encode("secret"));

		const location = {
			search: `?client_id=${client_id}&request=${request}`,
		};

		// @ts-ignore
		const response = await locationHandler(location);

		expect(response).to.deep.eq({
			data: {
				presentation_request: {
					client_id: "client_id",
					nonce: "nonce",
					response_mode: "response_mode",
					response_type: "response_type",
					response_uri: "response_uri",
					state: "state",
					dcql_query: null,
					client_metadata: null,
				},
				dcql_query: null,
				client_metadata: null,
			},
			nextStep: "generate_presentation",
			protocol: "oid4vp",
		});
	});

	it.skip("rejects with invalid client metadata", async () => {
		const client_id = "client_id";
		const response_uri = "response_uri";
		const response_type = "response_type";
		const response_mode = "response_mode";
		const nonce = "nonce";
		const state = "state";
		const client_metadata = {};

		const request = await new SignJWT({
			client_id,
			response_uri,
			response_type,
			response_mode,
			nonce,
			state,
			client_metadata,
		})
			.setProtectedHeader({ alg: "HS256" })
			.sign(new TextEncoder().encode("secret"));

		const location = {
			search: `?client_id=${client_id}&request=${request}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"could not validate client metadata",
			);
			expect(error.data).to.deep.eq({
				currentStep: "parse_location",
				error: [
					{
						instancePath: "",
						keyword: "required",
						message: "must have required property 'vp_formats_supported'",
						params: {
							missingProperty: "vp_formats_supported",
						},
						schemaPath: "#/required",
					},
				],
				location: undefined,
				nextStep: "generate_presentation",
				protocol: "oid4vp",
			});
		}
	});

	it("resolves with client metadata", async () => {
		const client_id = "client_id";
		const response_uri = "response_uri";
		const response_type = "response_type";
		const response_mode = "response_mode";
		const nonce = "nonce";
		const state = "state";
		const client_metadata = {
			jwks: { keys: [{}] },
			encrypted_response_enc_values_supported: ["ECDH-ES"],
			vp_formats_supported: { "vc+jpt": {} },
		};

		const request = await new SignJWT({
			client_id,
			response_uri,
			response_type,
			response_mode,
			nonce,
			state,
			client_metadata,
		})
			.setProtectedHeader({ alg: "HS256" })
			.sign(new TextEncoder().encode("secret"));

		const location = {
			search: `?client_id=${client_id}&request=${request}`,
		};

		// @ts-ignore
		const response = await locationHandler(location);

		expect(response).to.deep.eq({
			data: {
				presentation_request: {
					client_id: "client_id",
					nonce: "nonce",
					response_mode: "response_mode",
					response_type: "response_type",
					response_uri: "response_uri",
					state: "state",
					dcql_query: null,
					client_metadata: {
						encrypted_response_enc_values_supported: ["ECDH-ES"],
						jwks: {
							keys: [{}],
						},
						vp_formats_supported: {
							"vc+jpt": {},
						},
					},
				},
				dcql_query: null,
				client_metadata: {
					encrypted_response_enc_values_supported: ["ECDH-ES"],
					jwks: {
						keys: [{}],
					},
					vp_formats_supported: {
						"vc+jpt": {},
					},
				},
			},
			nextStep: "generate_presentation",
			protocol: "oid4vp",
		});
	});

	it("rejects with an invalid dcql query", async () => {
		const client_id = "client_id";
		const response_uri = "response_uri";
		const response_type = "response_type";
		const response_mode = "response_mode";
		const nonce = "nonce";
		const state = "state";
		const dcql_query = {};

		const request = await new SignJWT({
			client_id,
			response_uri,
			response_type,
			response_mode,
			nonce,
			state,
			dcql_query,
		})
			.setProtectedHeader({ alg: "HS256" })
			.sign(new TextEncoder().encode("secret"));

		const location = {
			search: `?client_id=${client_id}&request=${request}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}
			expect(error.error).to.eq("invalid_query");
			// @ts-ignore
			expect(error.data.error?.message).to.eq(
				"Expected input to be an array, but received 'undefined'",
			);
			// @ts-ignore
			expect(error.data.error?.issues).to.deep.eq([
				{
					abortEarly: undefined,
					abortPipeEarly: undefined,
					expected: "Array",
					input: undefined,
					issues: undefined,
					kind: "schema",
					lang: undefined,
					message: "Expected input to be an array, but received 'undefined'",
					path: [
						{
							input: {},
							key: "credentials",
							origin: "value",
							type: "object",
							value: undefined,
						},
					],
					received: "undefined",
					requirement: undefined,
					type: "array",
				},
			]);
			expect(error.error_description).to.eq("could not parse dcql query");
		}
	});

	it("resolves with a valid dcql query", async () => {
		const client_id = "client_id";
		const response_uri = "response_uri";
		const response_type = "response_type";
		const response_mode = "response_mode";
		const nonce = "nonce";
		const state = "state";
		const dcql_query = {
			credentials: [
				{
					id: "credential_id",
					format: "dc+sd-jwt",
				},
			],
		};

		const request = await new SignJWT({
			client_id,
			response_uri,
			response_type,
			response_mode,
			nonce,
			state,
			dcql_query,
		})
			.setProtectedHeader({ alg: "HS256" })
			.sign(new TextEncoder().encode("secret"));

		const location = {
			search: `?client_id=${client_id}&request=${request}`,
		};

		// @ts-ignore
		const response = await locationHandler(location);

		expect(response).to.deep.eq({
			data: {
				presentation_request: {
					client_id: "client_id",
					nonce: "nonce",
					response_mode: "response_mode",
					response_type: "response_type",
					response_uri: "response_uri",
					state: "state",
					dcql_query: {
						credentials: [
							{
								format: "dc+sd-jwt",
								id: "credential_id",
							},
						],
					},
					client_metadata: null,
				},
				dcql_query: {
					credentials: [
						{
							format: "dc+sd-jwt",
							id: "credential_id",
							multiple: false,
							require_cryptographic_holder_binding: true,
						},
					],
				},
				client_metadata: null,
			},
			nextStep: "generate_presentation",
			protocol: "oid4vp",
		});
	});

	describe("with a presentation request uri", () => {
		const request_uri = "http://request.uri";
		const client_id = "client_id";
		const response_uri = "response_uri";
		const response_type = "response_type";
		const response_mode = "response_mode";
		const nonce = "nonce";
		const state = "state";
		const locationHandler = locationHandlerFactory({
			// @ts-ignore
			httpClient: {
				get: async <T>(url: string) => {
					if (url !== request_uri) {
						throw new Error("invalid request_uri");
					}
					return {
						data: (await new SignJWT({
							client_id,
							response_uri,
							response_type,
							response_mode,
							nonce,
							state,
						})
							.setProtectedHeader({ alg: "HS256" })
							.sign(new TextEncoder().encode("secret"))) as T,
					};
				},
			},
			clientStateStore: clientStateStoreMock(),
			presentationCredentialsStore: presentationCredentialsStoreMock(),
		});

		it("returns a presentation request with request", async () => {
			const location = {
				search: `?client_id=${client_id}&request_uri=${request_uri}`,
			};

			// @ts-ignore
			const response = await locationHandler(location);

			expect(response).to.deep.eq({
				data: {
					presentation_request: {
						client_id: "client_id",
						nonce: "nonce",
						response_mode: "response_mode",
						response_type: "response_type",
						response_uri: "response_uri",
						state: "state",
						dcql_query: null,
						client_metadata: null,
					},
					dcql_query: null,
					client_metadata: null,
				},
				nextStep: "generate_presentation",
				protocol: "oid4vp",
			});
		});
	});

	it.skip("returns a presentation request with a request uri");
});
