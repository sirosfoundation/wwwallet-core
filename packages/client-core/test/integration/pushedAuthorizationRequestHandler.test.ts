import { assert, describe, expect, it } from "vitest";
import { OauthError } from "../../src/errors";
import { pushedAuthorizationRequestHandlerFactory } from "../../src/handlers";

const issuer = "http://issuer.url";
const config = {
	wallet_url: "http://wallet.url",
	httpClient: {
		post: async <T>(url: string) => {
			return { data: { request_uri: url } as T };
		},
	},
	static_clients: [
		{
			client_id: "id",
			issuer,
			pushed_authorization_request_endpoint: new URL("/par", issuer).toString(),
			authorize_endpoint: new URL("/authorize", issuer).toString(),
			scope: "scope",
		},
	],
};

const pushedAuthorizationRequestHandler =
	pushedAuthorizationRequestHandlerFactory(config);

describe("pushedAuthorizationRequestHandler", () => {
	it("rejects when no clients are associated to the issuer", async () => {
		const issuer = "http://issuer.other";
		const issuer_state = "issuer_state";
		try {
			await pushedAuthorizationRequestHandler({ issuer, issuer_state });

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}

			expect(error.error).to.eq("invalid_client");
			expect(error.error_description).to.eq("could not find issuer client");
		}
	});

	it("rejects with empty issuer state", async () => {
		const issuer_state = "";
		try {
			await pushedAuthorizationRequestHandler({ issuer, issuer_state });

			assert(false);
		} catch (error) {
			if (!(error instanceof OauthError)) {
				throw error;
			}

			expect(error.error).to.eq("invalid_request");
			expect(error.error_description).to.eq(
				"pushed authorization requests require an issuer state",
			);
		}
	});

	it("resolves", async () => {
		const issuer_state = "issuer_state";
		const response = await pushedAuthorizationRequestHandler({
			issuer,
			issuer_state,
		});
		expect(response).to.deep.eq({
			data: {
				authorize_url:
					"http://issuer.url/authorize?client_id=id&request_uri=http%3A%2F%2Fissuer.url%2Fpar%3Fredirect_uri%3Dhttp%253A%252F%252Fwallet.url%26client_id%3Did%26issuer_state%3Dissuer_state%26scope%3Dscope",
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
			wallet_url: "http://wallet.url",
			httpClient: {
				post: async <T>(url: string) => {
					if (url.match(pushed_authorization_request_endpoint)) {
						throw new Error("rejected");
					}

					return { data: { request_uri: url } as T };
				},
			},
			static_clients: [
				{
					client_id: "id",
					issuer,
					pushed_authorization_request_endpoint,
					authorize_endpoint: new URL("/authorize", issuer).toString(),
				},
			],
		};
		const pushedAuthorizationRequestHandler =
			pushedAuthorizationRequestHandlerFactory(config);

		it("rejects", async () => {
			const issuer_state = "issuer_state";
			try {
				await pushedAuthorizationRequestHandler({ issuer, issuer_state });

				assert(false);
			} catch (error) {
				if (!(error instanceof OauthError)) {
					throw error;
				}

				expect(error.error).to.eq("invalid_issuer");
				expect(error.error_description).to.eq(
					"could not perform pushed authorization request",
				);
			}
		});
	});
});
