import { EncryptJWT } from "jose";

export type GenerateAuthorizationRequestUriParams = {
	response_type: string;
	client_id: string;
	redirect_uri: string;
	scope?: string;
	state?: string;
	code_challenge?: string;
	code_challenge_method?: string;
};

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
		request_uri: `urn:wwwallet:authorization_request:${request_token}`,
		expires_in,
	};
}
