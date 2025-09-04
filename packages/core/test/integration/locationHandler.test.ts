import { assert, describe, expect, it } from "vitest";
import { OauthError } from "../../src/errors";
import { locationHandlerFactory } from "../../src/handlers";

const locationHandler = locationHandlerFactory({});

describe("location handler - no protocol", () => {
	const locationHandler = locationHandlerFactory({});

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
		if (response.nextStep !== "presentation_success") {
			return assert(false);
		}
		expect(response.data.code).to.eq(code);
	});
});

describe("location handler - credential offer", () => {
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

	it("returns an error with an invalid credential issuer", async () => {
		const credential_issuer = "credential_issuer";
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
				assert(false);
			}
			expect(error.error).to.eq("invalid_issuer");
			expect(error.error_description).to.eq(
				"could not fetch issuer information",
			);
		}
	});

	it("returns an error without grants", async () => {
		const credential_issuer = "https://demo-issuer.wwwallet.org/";
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
				assert(false);
			}
			expect(error.error).to.eq("invalid_location");
			expect(error.error_description).to.eq(
				"credential offer grants is not supported",
			);
		}
	});

	it("returns an error with empty grants", async () => {
		const credential_issuer = "https://demo-issuer.wwwallet.org/";
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
				"credential offer grants is not supported",
			);
		}
	});

	it("returns an error with an invalid grants", async () => {
		const credential_issuer = "https://demo-issuer.wwwallet.org/";
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
				"credential offer grants is not supported",
			);
		}
	});

	it("returns an error with an invalid authorization code grants", async () => {
		const credential_issuer = "https://demo-issuer.wwwallet.org/";
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
				"credential offer grants is not supported",
			);
		}
	});

	it("returns with a valid authorization code grants", async () => {
		const credential_issuer = "https://demo-issuer.wwwallet.org/";
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
		expect(response.nextStep).to.eq("pushed_authorization_request");
		assert(response.data?.issuer_metadata);
		expect(response.data?.credential_configuration_ids).to.deep.eq(
			credential_configuration_ids,
		);
	});

	it("returns with a valid authorization code grants (issuer_state)", async () => {
		const credential_issuer = "https://demo-issuer.wwwallet.org/";
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

		expect(response.protocol).to.eq("oid4vci");
		expect(response.nextStep).to.eq("pushed_authorization_request");
		assert(response.data?.issuer_metadata);
		expect(response.data?.credential_configuration_ids).to.deep.eq(
			credential_configuration_ids,
		);
		expect(response.data?.issuer_state).to.deep.eq(issuer_state);
	});
});
