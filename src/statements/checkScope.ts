import type { Config } from "../core";
import { OauthError } from "../errors";
import type { TokenHandlerConfig } from "../handlers";
import type { IssuerClient, OauthClient } from "../resources";

type checkScopeParams = {
	client: OauthClient | IssuerClient;
};

export async function checkScope(
	scope: string | undefined,
	{ client }: checkScopeParams,
	_config: TokenHandlerConfig | Config,
) {
	if (!scope) return { scope: "" };

	const scopes = scope.split(" ");

	if (scopes.filter((scope) => !client.scopes.includes(scope)).length) {
		throw new OauthError(400, "invalid_request", "invalid scope");
	}

	return { scope };
}
