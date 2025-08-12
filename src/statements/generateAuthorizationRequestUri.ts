import { EncryptJWT } from "jose";
import { AUTHORIZATION_REQUEST_URI_PREFIX } from "../constants";
import type { AuthorizationRequest } from "../resources";

export type GenerateAuthorizationRequestUriParams = AuthorizationRequest;

export type GenerateAuthorizationRequestUriConfig = {
	pushed_authorization_request_ttl: number;
	access_token_encryption: string;
	secret: string;
};

export async function generateAuthorizationRequestUri(
	{
		response_type,
		client_id,
		redirect_uri,
		scope,
		state,
		code_challenge,
		code_challenge_method,
	}: GenerateAuthorizationRequestUriParams,
	config: GenerateAuthorizationRequestUriConfig,
) {
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const request_token = await new EncryptJWT({
		response_type,
		client_id,
		redirect_uri,
		scope,
		state,
		code_challenge,
		code_challenge_method,
	})
		.setProtectedHeader({ alg: "dir", enc: config.access_token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + config.pushed_authorization_request_ttl)
		.encrypt(secret);

	const expires_in = config.pushed_authorization_request_ttl;

	return {
		request_uri: `${AUTHORIZATION_REQUEST_URI_PREFIX}${request_token}`,
		expires_in,
	};
}
