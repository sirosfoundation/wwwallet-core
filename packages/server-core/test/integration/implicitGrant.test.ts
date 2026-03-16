import { EncryptJWT, jwtDecrypt } from "jose";
import request from "supertest";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { app, protocols } from "../support/app";

describe("implicit grant - authorize", () => {
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

	it("returns an access token in redirection fragment", async () => {
		const response_type = "token";
		const client_id = "id";
		const redirect_uri = "http://redirect.uri";
		const scope = "client:scope";
		const state = "state";
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
		});

		const response = await request(app)
			.post("/authorize")
			.send({ username, password })
			.query({ client_id, request_uri });

		expect(response.status).toBe(302);
		expect(response.headers.location).toMatch(redirect_uri);
		expect(response.headers.location).toMatch(/#access_token=.+/);
		expect(response.headers.location).toMatch(/token_type=bearer/);
		expect(response.headers.location).toMatch(/expires_in=\d+/);
		expect(response.headers.location).toMatch(/state=state/);

		const location = new URL(response.headers.location);
		const fragment = new URLSearchParams(location.hash.replace("#", ""));

		const access_token = fragment.get("access_token");
		assert(access_token);

		const { payload } = await jwtDecrypt(
			access_token,
			new TextEncoder().encode(protocols.config.secret),
		);

		expect(payload.token_type).to.eq("access_token");
		expect(payload.client_id).to.eq(client_id);
		expect(payload.sub).to.eq("sub");
		expect(payload.scope).to.eq(scope);
	});
});
