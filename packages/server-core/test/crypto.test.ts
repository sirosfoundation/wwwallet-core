import { describe, expect, it } from "vitest";
import { secretDerivation } from "../src/crypto";

describe("crypto#secretDerivation", () => {
	it("returns a derivation", async () => {
		expect(await secretDerivation("secret", 0)).to.eq(
			"7e11a191fa879919dcf4e336e0d736091bee42c78d4ccb86214290a677884a7a",
		);
		expect(await secretDerivation("secret", 1)).to.eq(
			"ade975ebabea5b163727568c5b76056db474515bf6a3c62f192eb99097f5718f",
		);
		expect(await secretDerivation("secret", 2)).to.eq(
			"b3dbdc5d9082ab6a8ecf00da34cc56db90ff44325c914861c481b766f98e9a76",
		);
		expect(await secretDerivation("secret", 3)).to.eq(
			"8b52ff3804c7ecbcc8c58e42813a78ebdea58c00e5a335400aee8ede292b1640",
		);
	});
});
