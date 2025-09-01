import { describe, expect, it } from "vitest";
import { secretDerivation } from "../src/crypto";

describe("crypto#secretDerivation", () => {
	it("returns a derivation", () => {
		expect(secretDerivation("secret", 0)).to.eq(
			"ea24919e7655f76cce01b2ddb97a9e29",
		);
		expect(secretDerivation("secret", 1)).to.eq(
			"24c7df21cd3b4df2a28be1e2676de225",
		);
		expect(secretDerivation("secret", 2)).to.eq(
			"dbe1b2f508f23a97b3964dd46d5335e5",
		);
		expect(secretDerivation("secret", 3)).to.eq(
			"0f7a6511a3f095097eb23c4b7d08e56f",
		);
	});
});
