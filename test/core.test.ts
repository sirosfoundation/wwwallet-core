import { describe, expect, it } from "vitest";
import { Core } from "../src";

describe("validate configurations schema", () => {
	it("clientCredentials", () => {
		const core = new Core({});

		try {
			core.clientCredentials;
		} catch (error) {
			expect(error.message).to.eq(
				"Could not validate clientCredentials configuration - data must have required property 'secret'",
			);
		}
	});
});
