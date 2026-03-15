import { OauthError } from "../../errors";
import type { IssuerClient, OauthClient } from "../../resources";

export type ValidateScopeParams = {
	scope: string | undefined;
	client: OauthClient | IssuerClient;
};

export type ValidateScopeConfig = unknown;

/**
 * Validates each requested scope token against scopes assigned to the client.
 *
 * ## Why
 * Prevents privilege escalation by ensuring clients can request only scopes
 *   that were explicitly configured/authorized for them.
 *
 * ## Specification
 * - OAuth 2.0 scope parameter processing (RFC 6749 section 3.3).
 */
export async function validateScope(
	{ scope, client }: ValidateScopeParams,
	_config: ValidateScopeConfig,
) {
	if (!scope) return { scope: "" };
	if (typeof scope !== "string") {
		throw new OauthError(400, "invalid_request", "invalid scope");
	}

	const scopes = scope.trim().split(/\s+/);

	if (scopes.filter((scope) => !client.scopes.includes(scope)).length) {
		throw new OauthError(400, "invalid_request", "invalid scope");
	}

	return { scope };
}
