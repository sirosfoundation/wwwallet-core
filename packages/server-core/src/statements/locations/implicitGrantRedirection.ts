import type { AuthorizationRequest } from "../../resources";

export type ImplicitGrantRedirectionParams = {
	authorization_request: AuthorizationRequest;
	access_token: string;
	expires_in: number;
};

export type ImplicitGrantRedirectionConfig = unknown;

export async function implicitGrantRedirection(
	{
		authorization_request,
		access_token,
		expires_in,
	}: ImplicitGrantRedirectionParams,
	_config: ImplicitGrantRedirectionConfig,
) {
	const location = new URL(authorization_request.redirect_uri);

	const fragment = new URLSearchParams(location.hash.replace("#", ""));
	fragment.append("access_token", access_token);
	fragment.append("token_type", "bearer");
	fragment.append("expires_in", expires_in.toString());

	if (authorization_request.state) {
		fragment.append("state", authorization_request.state);
	}

	location.hash = fragment.toString();

	return { location: location.toString() };
}
