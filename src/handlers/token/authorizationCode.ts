import type { Request } from "express";
import { OauthError } from "../../errors";

export type AuthorizationCodeRequest = {
	grant_type: "authorization_code";
	client_id: string;
	client_secret: string;
	redirect_uri: string;
	code: string;
};

export async function validateAuthorizationCodeRequest(
	expressRequest: Request,
): Promise<AuthorizationCodeRequest> {
	const { client_id, client_secret, redirect_uri, code, grant_type } =
		expressRequest.body;

	if (!client_id) {
		throw new OauthError(
			400,
			"invalid_request",
			"client id is missing from body parameters",
		);
	}

	if (!redirect_uri) {
		throw new OauthError(
			400,
			"invalid_request",
			"redirect uri is missing from body parameters",
		);
	}

	if (!code) {
		throw new OauthError(
			400,
			"invalid_request",
			"code is missing from body parameters",
		);
	}

	return {
		client_id,
		client_secret,
		redirect_uri,
		code,
		grant_type,
	};
}
