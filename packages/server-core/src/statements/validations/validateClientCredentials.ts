import { OauthError } from "../../errors";
import type { AuthorizationRequest, OauthClient } from "../../resources";

type validateClientCredentialsParams = {
	client_id: string;
	client_secret?: string;
	redirect_uri?: string;
	authorization_request?: AuthorizationRequest;
	confidential?: boolean;
};

export type ValidateClientCredentialsConfig = {
	clients: Array<OauthClient>;
};

export async function validateClientCredentials(
	{
		client_id,
		client_secret,
		redirect_uri,
		authorization_request,
		confidential = true,
	}: validateClientCredentialsParams,
	config: ValidateClientCredentialsConfig,
): Promise<{ client: OauthClient }> {
	let client: OauthClient | undefined;

	if (!confidential && redirect_uri) {
		client = config.clients.find((client: OauthClient) => {
			return (
				client.id === client_id && client.redirect_uris?.includes(redirect_uri)
			);
		});
	}

	if (!confidential && authorization_request) {
		client = config.clients.find((client: OauthClient) => {
			return (
				client.id === client_id && client.id === authorization_request.client_id
			);
		});
	}

	if (confidential && client_secret) {
		client = config.clients.find((client: OauthClient) => {
			return client.id === client_id && client.secret === client_secret;
		});
	}

	if (!client) {
		throw new OauthError(401, "invalid_client", "invalid client credentials");
	}

	return { client };
}
