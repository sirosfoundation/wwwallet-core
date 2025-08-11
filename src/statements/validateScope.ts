import { OauthError } from "../errors";
import type { IssuerClient, OauthClient } from "../resources";

type validateScopeParams = {
	client: OauthClient | IssuerClient;
};

export type ValidateScopeConfig = unknown;

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
