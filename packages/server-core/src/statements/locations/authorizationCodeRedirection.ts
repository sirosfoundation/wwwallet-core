import type { AuthorizationRequest } from "../../resources";

export type AuthorizationCodeRedirectionParams = {
	authorization_request: AuthorizationRequest;
	authorization_code: string;
};

export type AuthorizationCodeRedirectionConfig = unknown;

export async function authorizationCodeRedirection(
	{
		authorization_request,
		authorization_code,
	}: AuthorizationCodeRedirectionParams,
	_config: AuthorizationCodeRedirectionConfig,
) {
	const location = new URL(authorization_request.redirect_uri);

	const query = location.searchParams;
	query.append("code", authorization_code);

	// TODO remove state from response query parameters
	if (authorization_request.state) {
		query.append("state", authorization_request.state);
	}

	return { location: location.toString() };
}
