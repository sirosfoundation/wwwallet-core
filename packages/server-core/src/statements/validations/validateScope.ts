import { OauthError } from "../../errors";
import type { IssuerClient, OauthClient } from "../../resources";

export type validateScopeParams = {
	client: OauthClient | IssuerClient;
};

export type ValidateScopeConfig = unknown;

/**
 * What:
 * - Validates each requested scope token against scopes assigned to the client.
 *
 * Why:
 * - Prevents privilege escalation by ensuring clients can request only scopes
 *   that were explicitly configured/authorized for them.
 *
 * Specification:
 * - OAuth 2.0 scope parameter processing (RFC 6749 section 3.3).
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
