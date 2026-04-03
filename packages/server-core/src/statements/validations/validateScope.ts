import { OauthError } from "../../errors";
import type { IssuerClient, OauthClient } from "../../resources";

export type validateScopeParams = {
	client: OauthClient | IssuerClient;
};

export type ValidateScopeConfig = unknown;

/**
 * Validates requested scope values against the client allowed scopes.
 *
 * ### Why (Security)
 * Scope allow-listing prevents privilege escalation through overbroad scope requests.
 *
 * ### Specifications
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 3.3, scope parameter
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 5.1, scope response semantics
 * - OpenID4VCI, scope-constrained credential authorization
 */
export async function validateScope(
	scope: string | undefined,
	{ client }: validateScopeParams,
	_config: ValidateScopeConfig,
) {
	if (!scope) return { scope: "" };

	const scopes = scope.split(" ");

	if (scopes.filter((scope) => !client.scopes.includes(scope)).length) {
		throw new OauthError(400, "invalid_request", "invalid scope");
	}

	return { scope };
}
