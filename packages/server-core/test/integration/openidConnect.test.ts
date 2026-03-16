import { createHash } from "node:crypto";
import { EncryptJWT, jwtVerify } from "jose";
import request from "supertest";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { app, protocols } from "../support/app";

function tokenHash(value: string) {
	const digest = createHash("sha256").update(value).digest();
	return digest.subarray(0, digest.length / 2).toString("base64url");
}

describe("openid connect", () => {
	let issuer_state: string;
	beforeEach(async () => {
		const now = Date.now() / 1000;
		const secret = new TextEncoder().encode(protocols.config.secret);

		issuer_state = await new EncryptJWT({
			sub: protocols.config.issuer_client?.id,
		})
			.setProtectedHeader({
				alg: "dir",
				enc: protocols.config.token_encryption || "",
			})
			.setIssuedAt()
			.setExpirationTime(now + (protocols.config.issuer_state_ttl || 0))
			.encrypt(secret);
	});

	it("returns id_token on token endpoint for authorization_code with openid scope", async () => {
		const response_type = "code";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const scope = "openid client:scope";
		const nonce = "oidc-nonce";
		const code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
		const code_challenge_method = "S256";
		const code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
		const username = "wwwallet";
		const password = "tellawww";

		const {
			body: { request_uri },
		} = await request(app).post("/pushed-authorization-request").send({
			response_type,
			client_id,
			redirect_uri,
			scope,
			issuer_state,
			nonce,
			code_challenge,
			code_challenge_method,
		});

		const authorizeResponse = await request(app)
			.post("/authorize")
			.send({ username, password })
			.query({ client_id, request_uri });

		expect(authorizeResponse.status).toBe(302);
		const [_all, code] =
			/code=([^&]+)/.exec(authorizeResponse.headers.location) || [];
		assert(code);

		const tokenResponse = await request(app).post("/token").send({
			grant_type: "authorization_code",
			client_id,
			redirect_uri,
			code,
			code_verifier,
		});

		expect(tokenResponse.status).toBe(200);
		assert(tokenResponse.body.id_token);
		assert(tokenResponse.body.access_token);

		const secret = new TextEncoder().encode(protocols.config.secret);
		const { payload } = await jwtVerify(tokenResponse.body.id_token, secret);

		expect(payload.iss).to.eq(protocols.config.issuer_url);
		expect(payload.aud).to.eq(client_id);
		expect(payload.sub).to.eq("sub");
		expect(payload.nonce).to.eq(nonce);
		expect(payload.at_hash).to.eq(tokenHash(tokenResponse.body.access_token));
	});

	it("exposes userinfo endpoint with openid access token", async () => {
		const response_type = "token";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const scope = "openid client:scope";
		const nonce = "implicit-flow-nonce";
		const username = "wwwallet";
		const password = "tellawww";

		const {
			body: { request_uri },
		} = await request(app).post("/pushed-authorization-request").send({
			response_type,
			client_id,
			redirect_uri,
			scope,
			issuer_state,
			nonce,
		});

		const authorizeResponse = await request(app)
			.post("/authorize")
			.send({ username, password })
			.query({ client_id, request_uri });
		expect(authorizeResponse.status).toBe(302);

		const location = new URL(authorizeResponse.headers.location);
		const fragment = new URLSearchParams(location.hash.replace("#", ""));
		const access_token = fragment.get("access_token");
		const id_token = fragment.get("id_token");
		assert(access_token);
		assert(id_token);

		const secret = new TextEncoder().encode(protocols.config.secret);
		const { payload } = await jwtVerify(id_token, secret);
		expect(payload.nonce).to.eq(nonce);

		const userinfoResponse = await request(app)
			.get("/userinfo")
			.set("Authorization", `Bearer ${access_token}`);

		expect(userinfoResponse.status).toBe(200);
		expect(userinfoResponse.body).to.deep.eq({ sub: "sub" });
	});

	it("rejects userinfo authorization header with malformed bearer prefix", async () => {
		const response_type = "token";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const scope = "openid client:scope";
		const nonce = "implicit-flow-nonce";
		const username = "wwwallet";
		const password = "tellawww";

		const {
			body: { request_uri },
		} = await request(app).post("/pushed-authorization-request").send({
			response_type,
			client_id,
			redirect_uri,
			scope,
			issuer_state,
			nonce,
		});

		const authorizeResponse = await request(app)
			.post("/authorize")
			.send({ username, password })
			.query({ client_id, request_uri });
		expect(authorizeResponse.status).toBe(302);

		const location = new URL(authorizeResponse.headers.location);
		const fragment = new URLSearchParams(location.hash.replace("#", ""));
		const access_token = fragment.get("access_token");
		assert(access_token);

		const userinfoResponse = await request(app)
			.get("/userinfo")
			.set("Authorization", `foo Bearer ${access_token}`);

		expect(userinfoResponse.status).toBe(401);
		expect(userinfoResponse.body).to.deep.eq({
			error: "invalid_request",
			error_description: "access token must be set",
		});
	});

	it("rejects userinfo dpop authorization without dpop proof header", async () => {
		const response_type = "token";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const scope = "openid client:scope";
		const nonce = "implicit-flow-nonce";
		const username = "wwwallet";
		const password = "tellawww";

		const {
			body: { request_uri },
		} = await request(app).post("/pushed-authorization-request").send({
			response_type,
			client_id,
			redirect_uri,
			scope,
			issuer_state,
			nonce,
		});

		const authorizeResponse = await request(app)
			.post("/authorize")
			.send({ username, password })
			.query({ client_id, request_uri });
		expect(authorizeResponse.status).toBe(302);

		const location = new URL(authorizeResponse.headers.location);
		const fragment = new URLSearchParams(location.hash.replace("#", ""));
		const access_token = fragment.get("access_token");
		assert(access_token);

		const userinfoResponse = await request(app)
			.get("/userinfo")
			.set("Authorization", `DPoP ${access_token}`);

		expect(userinfoResponse.status).toBe(400);
		expect(userinfoResponse.body).to.deep.eq({
			error: "invalid_request",
			error_description: "request requires a dpop value",
		});
	});

	it("rejects userinfo authorization header with multiple comma-separated values", async () => {
		const userinfoResponse = await request(app)
			.get("/userinfo")
			.set("Authorization", "Bearer one, Bearer two");

		expect(userinfoResponse.status).toBe(400);
		expect(userinfoResponse.body).to.deep.eq({
			error: "invalid_request",
			error_description: "authorization header is invalid",
		});
	});

	it("rejects implicit openid requests without nonce", async () => {
		const response_type = "token";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const scope = "openid client:scope";
		const username = "wwwallet";
		const password = "tellawww";

		const {
			body: { request_uri },
		} = await request(app).post("/pushed-authorization-request").send({
			response_type,
			client_id,
			redirect_uri,
			scope,
			issuer_state,
		});

		const authorizeResponse = await request(app)
			.post("/authorize")
			.send({ username, password })
			.query({ client_id, request_uri });

		expect(authorizeResponse.status).toBe(400);
		expect(authorizeResponse.text).toMatch(
			"nonce is missing from authorization request",
		);
	});
});
