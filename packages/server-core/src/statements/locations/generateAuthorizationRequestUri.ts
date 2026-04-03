import { EncryptJWT } from "jose";
import { AUTHORIZATION_REQUEST_URI_PREFIX } from "../../constants";
import type { AuthorizationRequest } from "../../resources";

export type GenerateAuthorizationRequestUriParams = AuthorizationRequest;

export type GenerateAuthorizationRequestUriConfig = {
	pushed_authorization_request_ttl: number;
	token_encryption: string;
	secret: string;
};

// TODO split authorization_request token generation from request_uri urn
/**
 * Encodes authorization request parameters into a protected request_uri token.
 *
 * ### Why (Security)
 * Protected request objects reduce front-channel parameter tampering.
 *
 * ### Specifications
 * - RFC 9126 (OAuth 2.0 Pushed Authorization Requests), pushed authorization request and request_uri
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 4.1.1, authorization request fields
 * - JWT-secured request object profile concepts
 */
export async function generateAuthorizationRequestUri(
	{
		response_type,
		client_id,
		redirect_uri,
		scope,
		state,
		code_challenge,
		code_challenge_method,
		issuer_state,
	}: GenerateAuthorizationRequestUriParams,
	config: GenerateAuthorizationRequestUriConfig,
) {
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const request_token = await new EncryptJWT({
		token_type: "authorization_request",
		response_type,
		client_id,
		redirect_uri,
		scope,
		state,
		code_challenge,
		code_challenge_method,
		issuer_state,
	})
		.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + config.pushed_authorization_request_ttl)
		.encrypt(secret);

	const expires_in = config.pushed_authorization_request_ttl;

	return {
		request_uri: `${AUTHORIZATION_REQUEST_URI_PREFIX}${request_token}`,
		expires_in,
	};
}
