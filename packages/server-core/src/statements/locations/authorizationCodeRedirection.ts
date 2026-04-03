import type { AuthorizationRequest } from "../../resources";

export type AuthorizationCodeRedirectionParams = {
	authorization_request: AuthorizationRequest;
	authorization_code: string;
};

export type AuthorizationCodeRedirectionConfig = unknown;

/**
 * Builds the authorization redirect location including code and optional state.
 *
 * ### Why (Security)
 * Returning state preserves request-response correlation and mitigates CSRF-style mixups.
 *
 * ### Specifications
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 4.1.2, authorization response
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 4.1.2.1, response error format
 * - OAuth 2.0 state correlation requirements
 */
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
