import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../support/app";

describe("healthz", () => {
	it("renders", async () => {
		const response = await request(app).get("/.well-known/oauth-authorization-server");

		expect(response.status).toBe(200);
    expect(response.body).to.deep.eq({
      "authorization_challenge_endpoint": "http://localhost:5000/authorization-challenge",
      "authorization_endpoint": "http://localhost:5000/authorize",
      "code_challenge_methods_supported": [
        "S256",
      ],
      "dpop_signing_alg_values_supported": [
        "ES256",
      ],
      "grant_types_supported": [
        "authorization_code",
        "refresh_token",
      ],
      "issuer": "http://localhost:5000",
      "jwks_uri": "http://localhost:5000/jwks",
      "pushed_authorization_request_endpoint": "http://localhost:5000/pushed-authorization-request",
      "require_pushed_authorization_requests": true,
      "response_types_supported": [
        "code",
      ],
      "scopes_supported": [
        "not_found:scope",
        "minimal:scope",
      ],
      "token_endpoint": "http://localhost:5000/token",
      "token_endpoint_auth_methods_supported": [
        "none",
      ],
    });
	});
});
