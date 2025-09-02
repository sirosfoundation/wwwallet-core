import { assert, describe, expect, it } from "vitest";
import { Core } from "../src";
import { secretDerivation } from "../src/crypto";

// TODO test handlers validation
describe("validate configurations schema", () => {
	it("#token", () => {
		// @ts-ignore
		const core = new Core({});

		try {
			core.token;

			assert(false);
		} catch (error) {
			expect((error as Error).message).to.eq(
				"Could not validate token handler configuration - data must have required property 'secret'",
			);
		}
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

describe("rotateSecret", () => {
	it("does not duplicate secrets.", async () => {
		const core = new Core({
			rotate_secret: false,
			secret_ttl: 0.01,
			secret_base: "aabbccddeeff",
		});
		let trials_left = 100;

		await new Promise<void>((resolve, reject) => {
			core.startRotateSecretTimer(async () => {
				// Make copies of core state so it doesn't change while evaluating this callback
				const current_secret = core.config.secret;
				const prev_secrets = (core.config.previous_secrets ?? []).slice();
				try {
					expect(current_secret).to.not.eq(prev_secrets[0]);
				} catch (e) {
					reject(e);
				}
				if (--trials_left <= 0) {
					resolve();
				}
			});
		}).finally(() => {
			core.stopRotateSecretTimer();
		});
	});

	it("does not skip secrets.", async () => {
		const secret_base = "aabbccddeeff";
		const secret_ttl = 0.01;
		const core = new Core({
			rotate_secret: false,
			secret_ttl,
			secret_base,
		});
		let trials_left = 100;

		let start_count: number = 0;
		const secret_sequence: Array<string> = [];
		const expected_secret_sequence: Array<string> = [];

		async function findPreviousCount(
			start_count: number,
			prev_secret: string,
		): Promise<number> {
			for (let count = start_count; count >= start_count - 10; --count) {
				const secret = await secretDerivation(secret_base, count);
				if (secret === prev_secret) {
					return count;
				}
			}
			throw new Error("Failed to determine count of previous secret");
		}

		await new Promise<void>((resolve, reject) => {
			core.startRotateSecretTimer(async () => {
				// Make copies of core state so it doesn't change while evaluating this callback
				const current_secret = core.config.secret;
				const now = Date.now() / 1000;
				const i = secret_sequence.length;

				try {
					if (
						current_secret &&
						current_secret !== secret_sequence[secret_sequence.length - 1]
					) {
						secret_sequence.push(current_secret);
						if (i === 0) {
							start_count = await findPreviousCount(
								Math.floor(now / secret_ttl) + 1,
								current_secret,
							);
							expected_secret_sequence.push(current_secret);
						} else {
							const expected_secret = await secretDerivation(
								secret_base,
								start_count + i,
							);
							expected_secret_sequence[i] = expected_secret;
							expect(current_secret).to.eq(
								expected_secret,
								`Skipped secret: ${expected_secret}; expected sequence ${expected_secret_sequence}, was: ${secret_sequence}`,
							);
						}
					}
				} catch (e) {
					reject(e);
				}
				if (--trials_left <= 0) {
					resolve();
				}
			});
		}).finally(() => {
			core.stopRotateSecretTimer();
		});
	});
});
