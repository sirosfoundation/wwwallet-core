import crypto from "node:crypto";
import { EncryptJWT, exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { OauthError } from "../../src/errors";
import {
	type ValidateProofsConfig,
	validateProofs,
} from "../../src/statements";
import { core } from "../support/app";

const trustedCertificate = `MIICyzCCAnGgAwIBAgIULnrxux9sI34oqbby3M4lSKOs8owwCgYIKoZIzj0EAwIwPzELMAkGA1UEBhMCRVUxFTATBgNVBAoMDHd3V2FsbGV0Lm9yZzEZMBcGA1UEAwwQd3dXYWxsZXQgUm9vdCBDQTAeFw0yNTA0MjkxMDI5NTNaFw0yNjA0MjkxMDI5NTNaMEExCzAJBgNVBAYTAkVVMRUwEwYDVQQKDAx3d1dhbGxldC5vcmcxGzAZBgNVBAMMEmxvY2FsLnd3d2FsbGV0Lm9yZzBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABFVivGt53M4qEP06QT20BSlGiMIdzLLvG+b9fq/fHKM+NGT+a3snXiPwU7X7jrOFWxwyjZeean40+vx6Gy06VfqjggFHMIIBQzAdBgNVHQ4EFgQUM/A3FTQLjww5/9u01MX/SRyVqaUwHwYDVR0jBBgwFoAU0HGu3T+/Wqh3yNifz9sNd+HPBS4wDgYDVR0PAQH/BAQDAgeAMDIGA1UdEgQrMCmBEWluZm9Ad3d3YWxsZXQub3JnhhRodHRwczovL3d3d2FsbGV0Lm9yZzASBgNVHSUECzAJBgcogYxdBQECMAwGA1UdEwEB/wQCMAAwRAYDVR0fBD0wOzA5oDegNYYzaHR0cHM6Ly93d3dhbGxldC5vcmcvaWFjYS9jcmwvd3d3YWxsZXRfb3JnX2lhY2EuY3JsMFUGA1UdEQROMEyCEmxvY2FsLnd3d2FsbGV0Lm9yZ4IZbG9jYWwtaXNzdWVyLnd3d2FsbGV0Lm9yZ4IbbG9jYWwtdmVyaWZpZXIud3d3YWxsZXQub3JnMAoGCCqGSM49BAMCA0gAMEUCIQCQ8h+5krhO+f4woReDY1D7CaM6qCda3m814e6DLvOphAIgHQL+Wm7WFRwxgjzMLN37RojJGrZbF4OFChIkmm0uu5o=`;
const privateKey = `
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgtfEWwPl5+13fqLPw
j/22afeqn/BgARhgjbtoRKcUFLyhRANCAARVYrxredzOKhD9OkE9tAUpRojCHcyy
7xvm/X6v3xyjPjRk/mt7J14j8FO1+46zhVscMo2Xnmp+NPr8ehstOlX6
-----END PRIVATE KEY-----
`;

describe("validate Proofs", () => {
	const config: ValidateProofsConfig = core.config as ValidateProofsConfig;

	it("resolves empty proofs", async () => {
		const proofs = {};

		return expect(validateProofs({ proofs }, config)).resolves.to.deep.eq({
			proofs: {},
		});
	});

	it("rejects with an unknown proof type", async () => {
		const proofs = { unknown: [] };

		return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
			new OauthError(400, "invalid_request", "unknown proof type"),
		);
	});

	describe("with a jwt proof", () => {
		it("resolves empty proof with no proof", async () => {
			const proofs = { jwt: [] };

			return expect(validateProofs({ proofs }, config)).resolves.to.deep.eq({
				proofs: { jwt: [] },
			});
		});

		it("rejects with an invalid jwt", async () => {
			const proofs = { jwt: ["invalid"] };

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(400, "invalid_request", "jwt proof #0 is invalid"),
			);
		});

		it("rejects with no jwk header in proof", async () => {
			const proof = await new SignJWT({})
				.setProtectedHeader({ alg: "HS256" })
				.sign(new TextEncoder().encode("secret"));
			const proofs = { jwt: [proof] };

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"jwk header is missing at jwt proof #0",
				),
			);
		});

		it("rejects without nonce claim in proof payload", async () => {
			const { publicKey, privateKey } = await generateKeyPair("ES256");
			const proof = await new SignJWT({})
				.setProtectedHeader({ alg: "ES256", jwk: await exportJWK(publicKey) })
				.sign(privateKey);
			const proofs = { jwt: [proof] };

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"nonce claim is missing at jwt proof #0",
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

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
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

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"nonce token type is invalid at jwt proof #0",
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

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"nonce subject is invalid at jwt proof #0",
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

			return expect(validateProofs({ proofs }, config)).resolves.to.deep.eq({
				proofs: { jwt: [proof] },
			});
		});
	});

	describe("with an attestation proof", () => {
		it("resolves empty proof with no proof", async () => {
			const proofs = { attestation: [] };

			return expect(validateProofs({ proofs }, config)).resolves.to.deep.eq({
				proofs: { attestation: [] },
			});
		});

		it("rejects with an invalid attestation", async () => {
			const proofs = { attestation: ["invalid"] };

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"attestation proof #0 is invalid",
				),
			);
		});

		it("rejects with no x5c header in proof", async () => {
			const proof = await new SignJWT({})
				.setProtectedHeader({ alg: "HS256" })
				.sign(new TextEncoder().encode("secret"));
			const proofs = { attestation: [proof] };

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"x5c header is missing at attestation proof #0",
				),
			);
		});

		it("resolves with empty x5c", async () => {
			const proof = await new SignJWT({})
				.setProtectedHeader({ alg: "HS256", x5c: [] })
				.sign(new TextEncoder().encode("secret"));
			const proofs = { attestation: [proof] };

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"invalid signature at attestation proof #0",
				),
			);
		});

		it("rejects with an invalid x5c chain", async () => {
			const notTrustedCertificate = `MIIB3jCCAYWgAwIBAgIUIn6e2dsdcjznHMr4EjoavrDSk+owCgYIKoZIzj0EAwIwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoMGEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yNTA4MjYxMDM1MzZaFw0yNjA4MjYxMDM1MzZaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQsPULcDYt/P23WZim2l4p7sm6YDHh6Ku1vhFea58Wi4lI3NbBnqmlLKZ61QuEIChjkBfFIENBl/I4jVZwiffeBo1MwUTAdBgNVHQ4EFgQUyDnicxm6cqN8SKFSXeoToIp1C70wHwYDVR0jBBgwFoAUyDnicxm6cqN8SKFSXeoToIp1C70wDwYDVR0TAQH/BAUwAwEB/zAKBggqhkjOPQQDAgNHADBEAiBl706vCby/S72f+rW6w+qugqbu0XX1CCU5zCyupOWQSgIgHKkssTGLFNgR0m5k5pnhKmZ4UiRn9hhv3CkZRA70Xos=`;

			const proof = await new SignJWT({})
				.setProtectedHeader({ alg: "HS256", x5c: [notTrustedCertificate] })
				.sign(new TextEncoder().encode("secret"));
			const proofs = { attestation: [proof] };

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"x5c certificate chain not trusted at attestation proof #0",
				),
			);
		});

		it("rejects with an invalid signature", async () => {
			const proof = await new SignJWT({})
				.setProtectedHeader({ alg: "HS256", x5c: [trustedCertificate] })
				.sign(new TextEncoder().encode("secret"));
			const proofs = { attestation: [proof] };

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"invalid signature at attestation proof #0",
				),
			);
		});

		it("rejects without nonce", async () => {
			const proof = await new SignJWT({})
				.setProtectedHeader({ alg: "ES256", x5c: [trustedCertificate] })
				.sign(crypto.createPrivateKey(privateKey));
			const proofs = { attestation: [proof] };

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"nonce claim is missing at attestation proof #0",
				),
			);
		});

		it("rejects with invalid nonce", async () => {
			const c_nonce = "invalid";

			const proof = await new SignJWT({ nonce: c_nonce })
				.setProtectedHeader({ alg: "ES256", x5c: [trustedCertificate] })
				.sign(crypto.createPrivateKey(privateKey));
			const proofs = { attestation: [proof] };

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"attestation proof #0 nonce is invalid",
				),
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

			const proof = await new SignJWT({ nonce: c_nonce })
				.setProtectedHeader({ alg: "ES256", x5c: [trustedCertificate] })
				.sign(crypto.createPrivateKey(privateKey));
			const proofs = { attestation: [proof] };

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"nonce token type is invalid at attestation proof #0",
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

			const proof = await new SignJWT({ nonce: c_nonce })
				.setProtectedHeader({ alg: "ES256", x5c: [trustedCertificate] })
				.sign(crypto.createPrivateKey(privateKey));
			const proofs = { attestation: [proof] };

			return expect(validateProofs({ proofs }, config)).rejects.to.deep.eq(
				new OauthError(
					400,
					"invalid_request",
					"nonce subject is invalid at attestation proof #0",
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

			const proof = await new SignJWT({ nonce: c_nonce })
				.setProtectedHeader({ alg: "ES256", x5c: [trustedCertificate] })
				.sign(crypto.createPrivateKey(privateKey));
			const proofs = { attestation: [proof] };

			return expect(validateProofs({ proofs }, config)).resolves.to.deep.eq({
				proofs: { attestation: [proof] },
			});
		});
	});
});
