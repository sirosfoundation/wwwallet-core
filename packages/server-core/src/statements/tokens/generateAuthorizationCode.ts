import { EncryptJWT } from "jose";
import { OauthError } from "../../errors";
import type { AuthorizationRequest, ResourceOwner } from "../../resources";

export type GenerateAuthorizationCodeParams = {
	authorization_request: AuthorizationRequest;
	resource_owner: ResourceOwner;
	scope: string;
};

export type GenerateAuthorizationCodeConfig = {
	authorization_code_ttl: number;
	token_encryption: string;
	secret: string;
};

export async function generateAuthorizationCode(
	{
		authorization_request,
		resource_owner,
		scope,
	}: GenerateAuthorizationCodeParams,
	config: GenerateAuthorizationCodeConfig,
) {
	if (!resource_owner.sub) {
		throw new OauthError(
			400,
			"invalid_request",
			"authorization code requires a subject",
		);
	}

	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const authorization_code = await new EncryptJWT({
		token_type: "authorization_code",
		redirect_uri: authorization_request.redirect_uri,
		code_challenge: authorization_request.code_challenge,
		code_challenge_method: authorization_request.code_challenge_method,
		sub: resource_owner.sub,
		scope,
	})
		.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
		.setIssuedAt()
		.setExpirationTime(now + config.authorization_code_ttl)
		.encrypt(secret);

	return { authorization_code };
}
