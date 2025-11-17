import { AUTHORIZATION_REQUEST_URI_PREFIX } from "../../constants";
import { type DecryptConfig, jwtDecryptWithConfigKeys } from "../../crypto";
import { OauthError } from "../../errors";
import type { AuthorizationRequest } from "../../resources";

export type validateRequestUriParams = {
	request_uri: string | undefined;
};

export type ValidateRequestUriConfig = DecryptConfig;

export async function validateRequestUri(
	{ request_uri }: validateRequestUriParams,
	config: ValidateRequestUriConfig,
) {
	if (!request_uri) {
		throw new OauthError(400, "invalid_request", "request_uri must be defined");
	}

	if (!request_uri.startsWith(AUTHORIZATION_REQUEST_URI_PREFIX)) {
		throw new OauthError(400, "invalid_request", "malformed request uri");
	}

	try {
		const {
			payload: {
				token_type,
				response_type,
				client_id,
				redirect_uri,
				scope,
				state,
				code_challenge,
				code_challenge_method,
				issuer_state,
			},
		} = await jwtDecryptWithConfigKeys<AuthorizationRequest>(
			request_uri.replace(AUTHORIZATION_REQUEST_URI_PREFIX, ""),
			config,
		);

		if (token_type !== "authorization_request") {
			throw new OauthError(
				401,
				"invalid_client",
				"authorization request is invalid",
			);
		}

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
				issuer_state,
			},
		};
	} catch (_error) {
		throw new OauthError(
			400,
			"invalid_request",
			"authorization request is invalid",
		);
	}
}
