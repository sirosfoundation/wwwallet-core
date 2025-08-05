import type { Config } from "..";
import { OauthError } from "../errors";
import type { IssuerClient, OauthClient } from "../resources";

type checkScopeParams = {
	client: OauthClient | IssuerClient;
};

export async function checkScope(
	scope: string | undefined,
	{ client }: checkScopeParams,
	_config: Config,
) {
	if (!scope) return { scope: "" };

	const scopes = scope.split(" ");

	if (scopes.filter((scope) => !client.scopes.includes(scope)).length) {
		throw new OauthError(400, "bad_request", "Invalid scope");
	}

	return { scope };
}
