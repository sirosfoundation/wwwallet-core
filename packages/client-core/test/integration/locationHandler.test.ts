import { SignJWT } from "jose";
import { assert, describe, expect, it } from "vitest";
import type { ClientState } from "../../src";
import { OauthError } from "../../src/errors";
import { locationHandlerFactory } from "../../src/handlers";
import {
	clientStateStoreMock,
	fetchIssuerMetadataMock,
} from "../support/client";

const locationHandler = locationHandlerFactory({
	// @ts-ignore
	httpClient: {
		get: async <T>(_url: string) => {
			return { data: {} as T };
		},
	},
	clientStateStore: clientStateStoreMock(),
	dpop_ttl_seconds: 10,
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
	it("returns an error", async () => {
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
				assert(false);
			}
			expect(error.error).to.eq("invalid_issuer");
			expect(error.error_description).to.eq(
				"could not fetch issuer information",
			);
		}
	});

	describe("when issuer metadata is present in client state", () => {
		const locationHandler = locationHandlerFactory({
			// @ts-ignore
			httpClient: {
				get: fetchIssuerMetadataMock({}),
			},
			clientStateStore: clientStateStoreMock({
				issuer_metadata: {},
			}),
			dpop_ttl_seconds: 10,
		});

		it("WIP return dpop", async () => {
			const code = "code";
			const state = "state";
			const location = {
				search: `?code=${code}&state=${state}`,
			};

			// @ts-ignore
			const response = await locationHandler(location);

			expect(response.protocol).to.eq("oid4vci");
			if (response.protocol === "oid4vci") {
				expect(response.nextStep).to.eq("credential_request");
				if (response.nextStep === "credential_request") {
					assert(response.data.access_token);
					assert(response.data.nonce);
				}
			}
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
	let lastClientState: ClientState;
	const locationHandler = locationHandlerFactory({
		// @ts-expect-error
		clientStateStore: {
			async create(issuer: string, issuer_state: string) {
				lastClientState = {
					issuer,
					issuer_state,
				};
				return lastClientState;
			},
			async setCredentialConfigurationIds(
				clientState: ClientState,
				credentialConfigurationIds: Array<string>,
			) {
				clientState.credential_configuration_ids = credentialConfigurationIds;
				return clientState;
			},
		},
	});

	it("returns an error with an invalid credential offer", async () => {
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
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"credential offer could not be parsed",
			);
		}
	});

	it("returns an error with an invalid credential offer (empty)", async () => {
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
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"credential offer must contain a credential issuer parameter",
			);
		}
	});

	it("returns an error with an invalid credential offer (credential_issuer)", async () => {
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
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"credential offer must contain a credential configuration ids parameter",
			);
		}
	});

	it("returns an error with an invalid credential offer (credential_configuration_ids)", async () => {
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
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"credential offer credential configuration ids parameter is invalid",
			);
		}
	});

	it("returns an error without grants", async () => {
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

	it("returns an error with empty grants", async () => {
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
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"given authorization grants are not supported",
			);
		}
	});

	it("returns an error with an invalid grants", async () => {
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
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"given authorization grants are not supported",
			);
		}
	});

	it("returns an error with an invalid authorization code grants", async () => {
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
				assert(false);
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
		if (response.protocol === "oid4vci") {
			expect(response.nextStep).to.eq("pushed_authorization_request");
			expect(response.data?.issuer).to.eq(credential_issuer);
			expect(response.data?.credential_configuration_ids).to.deep.eq(
				credential_configuration_ids,
			);
		}
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

		expect(lastClientState).to.deep.eq({
			credential_configuration_ids: ["credential_configuration_ids"],
			issuer: "https://issuer.url/",
			issuer_state: "issuer_state",
		});
		expect(response.protocol).to.eq("oid4vci");
		if (response.protocol === "oid4vci") {
			expect(response.nextStep).to.eq("pushed_authorization_request");
			expect(response.data?.issuer).to.eq(credential_issuer);
			expect(response.data?.credential_configuration_ids).to.deep.eq(
				credential_configuration_ids,
			);
			expect(response.data?.issuer_state).to.deep.eq(issuer_state);
		}
	});
});

describe("location handler - presentation request", () => {
	it("returns an error without response uri", async () => {
		const client_id = "client_id";
		const location = {
			search: `?client_id=${client_id}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"response uri parameter is missing",
			);
		}
	});

	it("returns an error without response type", async () => {
		const client_id = "client_id";
		const response_uri = "response_uri";
		const location = {
			search: `?client_id=${client_id}&response_uri=${response_uri}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"response type parameter is missing",
			);
		}
	});

	it("returns an error without response mode", async () => {
		const client_id = "client_id";
		const response_uri = "response_uri";
		const response_type = "response_type";
		const location = {
			search: `?client_id=${client_id}&response_uri=${response_uri}&response_type=${response_type}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"response mode parameter is missing",
			);
		}
	});

	it("returns an error without nonce", async () => {
		const client_id = "client_id";
		const response_uri = "response_uri";
		const response_type = "response_type";
		const response_mode = "response_mode";
		const location = {
			search: `?client_id=${client_id}&response_uri=${response_uri}&response_type=${response_type}&response_mode=${response_mode}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq("nonce parameter is missing");
		}
	});

	it("returns an error without state", async () => {
		const client_id = "client_id";
		const response_uri = "response_uri";
		const response_type = "response_type";
		const response_mode = "response_mode";
		const nonce = "nonce";
		const location = {
			search: `?client_id=${client_id}&response_uri=${response_uri}&response_type=${response_type}&response_mode=${response_mode}&nonce=${nonce}`,
		};

		try {
			// @ts-ignore
			await locationHandler(location);

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq("state parameter is missing");
		}
	});

	it("returns a presentation request", async () => {
		const client_id = "client_id";
		const response_uri = "response_uri";
		const response_type = "response_type";
		const response_mode = "response_mode";
		const nonce = "nonce";
		const state = "state";
		const location = {
			search: `?client_id=${client_id}&response_uri=${response_uri}&response_type=${response_type}&response_mode=${response_mode}&nonce=${nonce}&state=${state}`,
		};

		// @ts-ignore
		const response = await locationHandler(location);

		expect(response).to.deep.eq({
			data: {
				client_id: "client_id",
				nonce: "nonce",
				response_mode: "response_mode",
				response_type: "response_type",
				response_uri: "response_uri",
				state: "state",
			},
			nextStep: "presentation",
			protocol: "oid4vp",
		});
	});

	it("returns an error with invalid request", async () => {
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
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"could not parse presentation request",
			);
		}
	});

	it("returns a presentation request with request", async () => {
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
				client_id: "client_id",
				nonce: "nonce",
				response_mode: "response_mode",
				response_type: "response_type",
				response_uri: "response_uri",
				state: "state",
			},
			nextStep: "presentation",
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
						data: {
							client_id,
							response_uri,
							response_type,
							response_mode,
							nonce,
							state,
						} as T,
					};
				},
			},
			clientStateStore: clientStateStoreMock(),
		});

		it("returns a presentation request with request", async () => {
			const location = {
				search: `?client_id=${client_id}&request_uri=${request_uri}`,
			};

			// @ts-ignore
			const response = await locationHandler(location);

			expect(response).to.deep.eq({
				data: {
					client_id: "client_id",
					nonce: "nonce",
					response_mode: "response_mode",
					response_type: "response_type",
					response_uri: "response_uri",
					state: "state",
				},
				nextStep: "presentation",
				protocol: "oid4vp",
			});
		});
	});

	it.skip("returns a presentation request with a request uri");
});
