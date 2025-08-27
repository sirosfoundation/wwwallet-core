import { assert, describe, expect, it } from "vitest";
import { Core } from "../src";

// TODO test handlers validation
describe("validate configurations schema", () => {
	it("#token", () => {
		// @ts-ignore
		const core = new Core({});

		core.token;

		assert(true);
	});

	it("#credentialOffer", () => {
		// @ts-ignore
		const core = new Core({});

		try {
			core.credentialOffer;

			assert(false);
		} catch (error) {
			expect((error as Error).message).to.eq(
				"Could not validate credentialOffer handler configuration - data must have required property 'issuer_url'",
			);
		}
	});
});
