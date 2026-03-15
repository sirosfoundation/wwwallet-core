import { EncryptJWT, jwtDecrypt } from "jose";
import request from "supertest";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { app, protocols } from "../support/app";

describe("hybrid grant - authorize", () => {
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

	it("returns authorization code and access token in redirection fragment", async () => {
		const response_type = "code token";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const scope = "client:scope";
		const state = "state";
		const code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
		const code_challenge_method = "S256";
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
			state,
			code_challenge,
			code_challenge_method,
		});

		const response = await request(app)
			.post("/authorize")
			.send({ username, password })
			.query({ client_id, request_uri });

		expect(response.status).toBe(302);
		expect(response.headers.location).toMatch(redirect_uri);
		expect(response.headers.location).toMatch(/#code=.+/);
		expect(response.headers.location).toMatch(/access_token=.+/);
		expect(response.headers.location).toMatch(/token_type=bearer/);
		expect(response.headers.location).toMatch(/expires_in=\d+/);
		expect(response.headers.location).toMatch(/state=state/);

		const location = new URL(response.headers.location);
		const fragment = new URLSearchParams(location.hash.replace("#", ""));

		const authorization_code = fragment.get("code");
		assert(authorization_code);

		const { payload: authorization_code_payload } = await jwtDecrypt(
			authorization_code,
			new TextEncoder().encode(protocols.config.secret),
		);

		expect(authorization_code_payload.token_type).to.eq("authorization_code");
		expect(authorization_code_payload.scope).to.eq(scope);
		expect(authorization_code_payload.sub).to.eq("sub");
		expect(authorization_code_payload.redirect_uri).to.eq(redirect_uri);

		const access_token = fragment.get("access_token");
		assert(access_token);

		const { payload: access_token_payload } = await jwtDecrypt(
			access_token,
			new TextEncoder().encode(protocols.config.secret),
		);

		expect(access_token_payload.token_type).to.eq("access_token");
		expect(access_token_payload.client_id).to.eq(client_id);
		expect(access_token_payload.sub).to.eq("sub");
		expect(access_token_payload.scope).to.eq(scope);
	});
});
