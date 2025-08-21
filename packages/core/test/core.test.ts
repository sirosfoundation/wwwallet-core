import { assert, describe, expect, it } from "vitest";
import { Core } from "../src";

describe("validate configurations schema", () => {
	it("token", () => {
		const core = new Core({});

		try {
			core.token;

			assert(false);
		} catch (error) {
			expect(error.message).to.eq(
				"Could not validate token handler configuration - data must have required property 'secret'",
			);
		}
	});

	it("credentialOffer", () => {
		const core = new Core({});

		try {
			core.credentialOffer;

			assert(false);
		} catch (error) {
			expect(error.message).to.eq(
				"Could not validate credentialOffer handler configuration - data must have required property 'issuer_url'",
			);
		}
	});
});
