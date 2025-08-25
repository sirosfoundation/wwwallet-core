import { EncryptJWT, exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { OauthError } from "../../src/errors";
import type { IssuerClient } from "../../src/resources";
import { validateProofs } from "../../src/statements";
import { core } from "../support/app";

describe("validate Proofs", () => {
	const config = {
		secret: core.config.secret || "",
	};

	it("resolves empty proofs", async () => {
		const proofs = {};
		const client = {
			id: "id",
			secret: "secret",
			scopes: [],
		};

		expect(validateProofs({ proofs, client }, config)).resolves.to.deep.eq({
			proofs: {},
		});
	});

	it("rejects with an unknown proof type", async () => {
		const proofs = { unknown: [] };
		const client = {
			id: "id",
			secret: "secret",
			scopes: [],
		};

		expect(validateProofs({ proofs, client }, config)).rejects.to.deep.eq(
			new OauthError(400, "invalid_request", "unknown proof type"),
		);
	});

	describe("with a jwt proof", () => {
		it("resolves empty proof with no proof", async () => {
			const proofs = { jwt: [] };
			const client = {
				id: "id",
				secret: "secret",
				scopes: [],
			};

			expect(validateProofs({ proofs, client }, config)).resolves.to.deep.eq({
				proofs: { jwt: [] },
			});
		});

		it("rejects with an invalid jwt", async () => {
			const proofs = { jwt: ["invalid"] };
			const client = {
				id: "id",
				secret: "secret",
				scopes: [],
			};

			expect(validateProofs({ proofs, client }, config)).rejects.to.deep.eq(
				new OauthError(400, "invalid_request", "jwt proof #0 is invalid"),
			);
		});

		it("rejects with no jwk header in proof header", async () => {
			const proof = await new SignJWT({})
				.setProtectedHeader({ alg: "HS256" })
				.sign(new TextEncoder().encode("secret"));
			const proofs = { jwt: [proof] };

			const client = {
				id: "id",
				secret: "secret",
				scopes: [],
			};

			expect(validateProofs({ proofs, client }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"jwk header is missing in jwt proof #0",
				),
			);
		});

		it("rejects without nonce claim in proof payload", async () => {
			const { publicKey, privateKey } = await generateKeyPair("ES256");
			const proof = await new SignJWT({})
				.setProtectedHeader({ alg: "ES256", jwk: await exportJWK(publicKey) })
				.sign(privateKey);
			const proofs = { jwt: [proof] };

			const client = {
				id: "id",
				secret: "secret",
				scopes: [],
			};

			expect(validateProofs({ proofs, client }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"nonce claim is missing in jwt proof #0",
				),
			);
		});

		it("rejects with an invalid nonce", async () => {
			const { publicKey, privateKey } = await generateKeyPair("ES256");
			const nonce = "nonce";
			const proof = await new SignJWT({ nonce })
				.setProtectedHeader({ alg: "ES256", jwk: await exportJWK(publicKey) })
				.sign(privateKey);
			const proofs = { jwt: [proof] };

			const client = {
				id: "id",
				secret: "secret",
				scopes: [],
			};

			expect(validateProofs({ proofs, client }, config)).rejects.to.deep.eq(
				new OauthError(400, "invalid_request", "jwt proof #0 nonce is invalid"),
			);
		});

		it("rejects with an invalid nonce (token type)", async () => {
			const secret = new TextEncoder().encode(core.config.secret);
			const now = Date.now() / 1000;
			const c_nonce = await new EncryptJWT({
				token_type: "invalid",
			})
				.setProtectedHeader({
					alg: "dir",
					enc: core.config.token_encryption || "",
				})
				.setIssuedAt()
				.setExpirationTime(now + (core.config.access_token_ttl || 0))
				.encrypt(secret);

			const { publicKey, privateKey } = await generateKeyPair("ES256");
			const proof = await new SignJWT({ nonce: c_nonce })
				.setProtectedHeader({ alg: "ES256", jwk: await exportJWK(publicKey) })
				.sign(privateKey);
			const proofs = { jwt: [proof] };

			const client = {
				id: "id",
				secret: "secret",
				scopes: [],
			};

			expect(validateProofs({ proofs, client }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"nonce token type is invalid in jwt proof #0",
				),
			);
		});

		it("rejects with an invalid nonce (sub)", async () => {
			const secret = new TextEncoder().encode(core.config.secret);
			const now = Date.now() / 1000;
			const c_nonce = await new EncryptJWT({
				token_type: "c_nonce",
				sub: "invalid",
			})
				.setProtectedHeader({
					alg: "dir",
					enc: core.config.token_encryption || "",
				})
				.setIssuedAt()
				.setExpirationTime(now + (core.config.access_token_ttl || 0))
				.encrypt(secret);

			const { publicKey, privateKey } = await generateKeyPair("ES256");
			const proof = await new SignJWT({ nonce: c_nonce })
				.setProtectedHeader({ alg: "ES256", jwk: await exportJWK(publicKey) })
				.sign(privateKey);
			const proofs = { jwt: [proof] };

			const client = {
				id: "id",
				secret: "secret",
				scopes: [],
			};

			expect(validateProofs({ proofs, client }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"nonce subject is invalid in jwt proof #0",
				),
			);
		});

		it("resolves with a valid nonce", async () => {
			const secret = new TextEncoder().encode(core.config.secret);
			const now = Date.now() / 1000;
			const c_nonce = await new EncryptJWT({
				token_type: "c_nonce",
				sub: core.config.issuer_client?.id,
			})
				.setProtectedHeader({
					alg: "dir",
					enc: core.config.token_encryption || "",
				})
				.setIssuedAt()
				.setExpirationTime(now + (core.config.access_token_ttl || 0))
				.encrypt(secret);
			const { publicKey, privateKey } = await generateKeyPair("ES256");
			const proof = await new SignJWT({ nonce: c_nonce })
				.setProtectedHeader({ alg: "ES256", jwk: await exportJWK(publicKey) })
				.sign(privateKey);
			const proofs = { jwt: [proof] };

			const client = core.config.issuer_client as IssuerClient;

			expect(validateProofs({ proofs, client }, config)).resolves.to.deep.eq({
				proofs: { jwt: [proof] },
			});
		});
	});
});
