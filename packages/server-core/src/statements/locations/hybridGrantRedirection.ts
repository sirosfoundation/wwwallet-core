import type { AuthorizationRequest } from "../../resources";

export type HybridGrantRedirectionParams = {
	authorization_request: AuthorizationRequest;
	authorization_code: string;
	access_token: string;
	expires_in: number;
	id_token?: string;
};

export type HybridGrantRedirectionConfig = unknown;

export async function hybridGrantRedirection(
	{
		authorization_request,
		authorization_code,
		access_token,
		expires_in,
		id_token,
	}: HybridGrantRedirectionParams,
	_config: HybridGrantRedirectionConfig,
) {
	const location = new URL(authorization_request.redirect_uri);

	const fragment = new URLSearchParams(location.hash.replace("#", ""));
	fragment.append("code", authorization_code);
	fragment.append("access_token", access_token);
	fragment.append("token_type", "bearer");
	fragment.append("expires_in", expires_in.toString());
	if (id_token) {
		fragment.append("id_token", id_token);
	}

	if (authorization_request.state) {
		fragment.append("state", authorization_request.state);
	}

	location.hash = fragment.toString();

	return { location: location.toString() };
}
