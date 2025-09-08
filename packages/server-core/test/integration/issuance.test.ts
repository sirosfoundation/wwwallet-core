import crypto from "node:crypto";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import request from "supertest";
import { assert, describe, it } from "vitest";
import { app, core } from "../support/app";

describe("issuance flow", () => {
	it("issues a credential", async () => {
		// ----------
		const scope = "full:scope";
		const credentialOffer = await request(app)
			.get(`/offer/${scope}`)
			.set("Accept", "application/json");

		const [_all1, issuer_state] = /issuer_state%22%3A%22([^%]+)%22/.exec(
			credentialOffer.body.credential_offer_url,
		) || [""];

		// ----------
		const response_type = "code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const code_challenge = "n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg";
		const code_challenge_method = "S256";
		const pushedAuthorizationRequest = await request(app)
			.post("/pushed-authorization-request")
			.send({
				response_type,
				client_id,
				redirect_uri,
				scope,
				issuer_state,
				code_challenge,
				code_challenge_method,
			});

		const request_uri = pushedAuthorizationRequest.body.request_uri;

		// ----------
		const _authorize = await request(app)
			.get("/authorize")
			.query({ client_id, request_uri });

		// ----------
		const username = "wwwallet";
		const password = "tellawww";
		const authenticate = await request(app)
			.post("/authorize")
			.send({ username, password })
			.query({ client_id, request_uri });

		const [_all, code] =
			/code=([^&]+)/.exec(authenticate.headers.location) || [];

		// ----------
		const grant_type = "authorization_code";
		const code_verifier = "test";

		const token = await request(app)
			.post("/token")
			.send({ grant_type, client_id, redirect_uri, code, code_verifier });

		const access_token = token.body.access_token;

		// ----------
		const nonce = await request(app).post("/nonce");

		const c_nonce = nonce.body.c_nonce;

		// ----------
		const credential_configuration_id = "full";
		const { publicKey, privateKey } = await generateKeyPair("ES256");
		const ath = crypto
			.createHash("sha256")
			.update(access_token)
			.digest("base64url");
		const claims = {
			jti: "jti",
			htm: "POST",
			htu: "http://localhost:5000/credential",
			iat: Math.floor(Date.now() / 1000),
			ath,
		};

		const dpop = await new SignJWT(claims)
			.setProtectedHeader({
				typ: "dpop+jwt",
				alg: "ES256",
				jwk: await exportJWK(publicKey),
			})
			.sign(privateKey);

		const proof = await new SignJWT({ nonce: c_nonce })
			.setProtectedHeader({ alg: "ES256", jwk: await exportJWK(publicKey) })
			.sign(privateKey);
		const credential = await request(app)
			.post("/credential")
			.set("Authorization", `Bearer ${access_token}`)
			.set("DPoP", dpop)
			.send({ credential_configuration_id, proofs: { jwt: [proof] } });

		assert(credential.body.credentials[0].credential);
	});

	const steps = [
		"credentialOffer",
		"pushedAuthorizationRequest",
		"authorize",
		"authenticate",
		"token",
		"nonce",
		"credential",
	];

	steps.forEach((step: string) => {
		it(`issues a credential with secret rotation at ${step} step`, async () => {
			// ----------
			if (
				steps.indexOf("credentialOffer") % steps.length ===
				steps.indexOf(step)
			) {
				core.config.previous_secrets?.unshift(core.config.secret || "");
				core.config.secret = crypto.randomBytes(16).toString("hex");
			}
			const scope = "full:scope";
			const credentialOffer = await request(app)
				.get(`/offer/${scope}`)
				.set("Accept", "application/json");

			const [_all1, issuer_state] = /issuer_state%22%3A%22([^%]+)%22/.exec(
				credentialOffer.body.credential_offer_url,
			) || [""];

			// ----------
			if (
				steps.indexOf("pushedAuthorizationRequest") % steps.length ===
				steps.indexOf(step)
			) {
				core.config.previous_secrets?.unshift(core.config.secret || "");
				core.config.secret = crypto.randomBytes(16).toString("hex");
			}
			const response_type = "code";
			const client_id = "id";
			const redirect_uri = "http://redirect.uri";
			const code_challenge = "n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg";
			const code_challenge_method = "S256";
			const pushedAuthorizationRequest = await request(app)
				.post("/pushed-authorization-request")
				.send({
					response_type,
					client_id,
					redirect_uri,
					scope,
					issuer_state,
					code_challenge,
					code_challenge_method,
				});

			const request_uri = pushedAuthorizationRequest.body.request_uri;

			// ----------
			if (steps.indexOf("authorize") % steps.length === steps.indexOf(step)) {
				core.config.previous_secrets?.unshift(core.config.secret || "");
				core.config.secret = crypto.randomBytes(16).toString("hex");
			}
			const _authorize = await request(app)
				.get("/authorize")
				.query({ client_id, request_uri });
			// ----------
			if (
				steps.indexOf("authenticate") % steps.length ===
				steps.indexOf(step)
			) {
				core.config.previous_secrets?.unshift(core.config.secret || "");
				core.config.secret = crypto.randomBytes(16).toString("hex");
			}
			const username = "wwwallet";
			const password = "tellawww";
			const authenticate = await request(app)
				.post("/authorize")
				.send({ username, password })
				.query({ client_id, request_uri });

			const [_all, code] =
				/code=([^&]+)/.exec(authenticate.headers.location) || [];

			// ----------
			if (steps.indexOf("token") % steps.length === steps.indexOf(step)) {
				core.config.previous_secrets?.unshift(core.config.secret || "");
				core.config.secret = crypto.randomBytes(16).toString("hex");
			}
			const grant_type = "authorization_code";
			const code_verifier = "test";

			const token = await request(app)
				.post("/token")
				.send({ grant_type, client_id, redirect_uri, code, code_verifier });

			const access_token = token.body.access_token;

			// ----------
			if (steps.indexOf("nonce") % steps.length === steps.indexOf(step)) {
				core.config.previous_secrets?.unshift(core.config.secret || "");
				core.config.secret = crypto.randomBytes(16).toString("hex");
			}
			const nonce = await request(app).post("/nonce");

			const c_nonce = nonce.body.c_nonce;

			// ----------
			if (steps.indexOf("credential") % steps.length === steps.indexOf(step)) {
				core.config.previous_secrets?.unshift(core.config.secret || "");
				core.config.secret = crypto.randomBytes(16).toString("hex");
			}
			const credential_configuration_id = "full";
			const { publicKey, privateKey } = await generateKeyPair("ES256");
			const ath = crypto
				.createHash("sha256")
				.update(access_token)
				.digest("base64url");
			const claims = {
				jti: "jti",
				htm: "POST",
				htu: "http://localhost:5000/credential",
				iat: Math.floor(Date.now() / 1000),
				ath,
			};

			const dpop = await new SignJWT(claims)
				.setProtectedHeader({
					typ: "dpop+jwt",
					alg: "ES256",
					jwk: await exportJWK(publicKey),
				})
				.sign(privateKey);

			const proof = await new SignJWT({ nonce: c_nonce })
				.setProtectedHeader({ alg: "ES256", jwk: await exportJWK(publicKey) })
				.sign(privateKey);
			const credential = await request(app)
				.post("/credential")
				.set("Authorization", `Bearer ${access_token}`)
				.set("DPoP", dpop)
				.send({ credential_configuration_id, proofs: { jwt: [proof] } });

			assert(credential.body.credentials[0].credential);
		});
	});
});
