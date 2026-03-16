import type { AuthorizationRequest } from "../../resources";

export type ImplicitGrantRedirectionParams = {
	authorization_request: AuthorizationRequest;
	access_token: string;
	expires_in: number;
	id_token?: string;
};

export type ImplicitGrantRedirectionConfig = unknown;

/**
 * Builds redirect URI fragment response containing `access_token`,
 *   `token_type`, `expires_in`, optional `id_token`, and optional `state`.
 *
 * ## Why
 * Implicit/hybrid front-channel responses require fragment-based token
 *   delivery to avoid token leakage through query logging/intermediaries.
 *
 * ## Specification
 * - OAuth 2.0 (RFC 6749) section 4.2.2.
 * - OpenID Connect Core 1.0 when `id_token` is included.
 */
export async function implicitGrantRedirection(
	{
		authorization_request,
		access_token,
		expires_in,
		id_token,
	}: ImplicitGrantRedirectionParams,
	_config: ImplicitGrantRedirectionConfig,
) {
	const location = new URL(authorization_request.redirect_uri);

	const fragment = new URLSearchParams(location.hash.replace("#", ""));
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
