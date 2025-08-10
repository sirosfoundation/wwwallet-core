import { OauthError } from "../errors";
import type { OauthClient } from "../resources";

type checkClientCredentialsParams = {
	client_id: string;
	client_secret: string;
};

export type CheckClientCredentialsConfig = {
	clients: Array<{ id: string; secret: string; scopes: Array<string> }>;
};

export async function checkClientCredentials(
	{ client_id, client_secret }: checkClientCredentialsParams,
	config: CheckClientCredentialsConfig,
): Promise<{ client: OauthClient }> {
	const client = config.clients.find(
		(client: { id: string; secret: string }) => {
			return client.id === client_id && client.secret === client_secret;
		},
	);

	if (!client) {
		throw new OauthError(
			401,
			"invalid_client",
			"invalid client_id or client_secret",
		);
	}

	return { client };
}
