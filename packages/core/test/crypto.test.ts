import { describe, expect, it } from "vitest";
import { secretDerivation } from "../src/crypto";

describe("crypto#secretDerivation", () => {
	it("returns a derivation", async () => {
		expect(await secretDerivation("secret", 0)).to.eq(
			"7e11a191fa879919dcf4e336e0d73609",
		);
		expect(await secretDerivation("secret", 1)).to.eq(
			"4b732d0ff5bd2a5ef10cd6a8cb9e89ce",
		);
		expect(await secretDerivation("secret", 2)).to.eq(
			"c47339957687359b73179db33e434551",
		);
		expect(await secretDerivation("secret", 3)).to.eq(
			"e05b5211bf3db7473e616fe0ac31a502",
		);
	});
});
