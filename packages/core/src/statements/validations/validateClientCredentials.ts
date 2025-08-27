import { jwtDecrypt } from "jose";
import { JWEDecryptionFailed } from "jose/errors";
import { AUTHORIZATION_REQUEST_URI_PREFIX } from "../../constants";
import { OauthError } from "../../errors";
import type { OauthClient } from "../../resources";

type validateClientCredentialsParams = {
	client_id: string;
	client_secret?: string;
	redirect_uri?: string;
	request_uri?: string;
	confidential?: boolean;
};

export type ValidateClientCredentialsConfig = {
	clients: Array<OauthClient>;
	secret: string;
	previous_secrets: Array<string>;
};

export async function validateClientCredentials(
	{
		client_id,
		client_secret,
		redirect_uri,
		request_uri,
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

	if (!confidential && request_uri) {
		try {
			const {
				payload: { client_id: requestClientId },
			} = await jwtDecrypt<{ client_id: string }>(
				request_uri.replace(AUTHORIZATION_REQUEST_URI_PREFIX, ""),
				new TextEncoder().encode(config.secret),
			).catch((error) => {
				if (error instanceof JWEDecryptionFailed) {
					return jwtDecrypt<{ client_id: string }>(
						request_uri.replace(AUTHORIZATION_REQUEST_URI_PREFIX, ""),
						new TextEncoder().encode(config.previous_secrets[0]),
					);
				}

				throw error;
			});
			client = config.clients.find((client: OauthClient) => {
				return client.id === client_id && client.id === requestClientId;
			});
		} catch (_error) {
			throw new OauthError(401, "invalid_client", "invalid client credentials");
		}
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
