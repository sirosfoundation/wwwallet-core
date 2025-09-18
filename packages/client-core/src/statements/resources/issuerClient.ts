import { OauthError } from "../../errors";
import type { OauthClient } from "../../resources";

export type IssuerClientParams = {
	issuer: string;
};

export type IssuerClientConfig = {
	static_clients: Array<OauthClient>;
};

export async function issuerClient(
	{ issuer }: IssuerClientParams,
	config: IssuerClientConfig,
) {
	const client = config.static_clients.find(
		(client) => client.issuer === issuer,
	);

	if (!client) {
		throw new OauthError("invalid_client", "could not find issuer client");
	}

	return { client };
}
