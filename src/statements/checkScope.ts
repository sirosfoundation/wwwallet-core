import { OauthError } from "../errors";
import type { IssuerClient, OauthClient } from "../resources";

type checkScopeParams = {
	client: OauthClient | IssuerClient;
};

export type CheckScopeConfig = unknown;

export async function checkScope(
	scope: string | undefined,
	{ client }: checkScopeParams,
	_config: CheckScopeConfig,
) {
	if (!scope) return { scope: "" };

	const scopes = scope.split(" ");

	if (scopes.filter((scope) => !client.scopes.includes(scope)).length) {
		throw new OauthError(400, "invalid_request", "invalid scope");
	}

	return { scope };
}
