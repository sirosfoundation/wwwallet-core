import { describe, expect, it } from "vitest";
import { secretDerivation } from "../src/crypto";

describe("crypto#secretDerivation", () => {
	it("returns a derivation", async () => {
		expect(await secretDerivation("secret", 0)).to.eq(
			"7e11a191fa879919dcf4e336e0d73609",
		);
		expect(await secretDerivation("secret", 1)).to.eq(
			"ade975ebabea5b163727568c5b76056d",
		);
		expect(await secretDerivation("secret", 2)).to.eq(
			"b3dbdc5d9082ab6a8ecf00da34cc56db",
		);
		expect(await secretDerivation("secret", 3)).to.eq(
			"8b52ff3804c7ecbcc8c58e42813a78eb",
		);
	});
});
