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
 * Encodes authorization request parameters into a signed/encrypted request
 *   object and returns a `request_uri` plus `expires_in`.
 *
 * ## Why
 * PAR moves sensitive/large parameters off the front-channel and ensures the
 *   authorization endpoint consumes issuer-authenticated request content.
 *
 * ## Specification
 * - OAuth 2.0 Pushed Authorization Requests (RFC 9126).
 */
export async function generateAuthorizationRequestUri(
	{
		response_type,
		client_id,
		redirect_uri,
		scope,
		state,
		nonce,
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
		nonce,
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
