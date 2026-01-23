import crypto from "node:crypto";
import { jwtVerify } from "jose";
import { OauthError } from "../../errors";
import type { AuthorizationRequest, OauthClient } from "../../resources";

export type validateClientCredentialsParams = {
	client_id?: string;
	client_secret?: string;
	redirect_uri?: string;
	oauth_client_attestation?: string;
	authorization_request?: AuthorizationRequest;
	confidential?: boolean;
};

export type ValidateClientCredentialsConfig = {
	clients: Array<OauthClient>;
	trusted_root_certificates: Array<string>;
};

export async function validateClientCredentials(
	{
		client_id,
		client_secret,
		redirect_uri,
		oauth_client_attestation,
		authorization_request,
		confidential = true,
	}: validateClientCredentialsParams,
	config: ValidateClientCredentialsConfig,
): Promise<{ client: OauthClient }> {
	let client: OauthClient | undefined;

	if (oauth_client_attestation) {
		let found = false;
		for (const certificate of config.trusted_root_certificates) {
			try {
				const { publicKey } = new crypto.X509Certificate(certificate);
				const { payload } = await jwtVerify(
					oauth_client_attestation,
					publicKey,
				);

				client = config.clients.find(({ id }) => id === payload.sub);
				found = !!client;
			} catch (_error) {}
		}

		if (!found) {
			throw new OauthError(
				401,
				"invalid_client",
				"oauth client attestation does not match any known client",
			);
		}
	}

	if (!confidential && redirect_uri) {
		client =
			client ||
			config.clients.find((current: OauthClient) => {
				return current.id === client_id;
			});

		if (!client?.redirect_uris?.includes(redirect_uri)) {
			throw new OauthError(401, "invalid_client", "invalid client credentials");
		}
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
