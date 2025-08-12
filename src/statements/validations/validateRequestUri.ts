import { jwtDecrypt } from "jose";
import { AUTHORIZATION_REQUEST_URI_PREFIX } from "../../constants";
import { OauthError } from "../../errors";
import type { AuthorizationRequest } from "../../resources";

type validateRequestUriParams = {
	request_uri: string | undefined;
};

export type ValidateRequestUriConfig = {
	secret: string;
};

export async function validateRequestUri(
	{ request_uri }: validateRequestUriParams,
	config: ValidateRequestUriConfig,
) {
	if (!request_uri) {
		throw new OauthError(400, "bad_request", "request_uri must be defined");
	}

	if (!request_uri.startsWith(AUTHORIZATION_REQUEST_URI_PREFIX)) {
		throw new OauthError(400, "bad_request", "malformed request_uri");
	}

	try {
		const {
			payload: {
				response_type,
				client_id,
				redirect_uri,
				scope,
				state,
				code_challenge,
				code_challenge_method,
			},
		} = await jwtDecrypt<AuthorizationRequest>(
			request_uri.replace(AUTHORIZATION_REQUEST_URI_PREFIX, ""),
			new TextEncoder().encode(config.secret),
		);

		return {
			request_uri,
			authorization_request: {
				response_type,
				client_id,
				redirect_uri,
				scope,
				state,
				code_challenge,
				code_challenge_method,
			},
		};
	} catch (_error) {
		throw new OauthError(401, "invalid_client", "could not parse request_uri");
	}
}
