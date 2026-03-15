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

/**
 * Validates client identity using secret, attestation, and/or redirect/client
 *   binding depending on flow confidentiality requirements.
 *
 * ## Why
 * Every OAuth/OIDC flow depends on trustworthy client identity before issuing
 *   tokens or accepting pushed authorization requests, including strict
 *   `redirect_uri` and `client_id` binding for authorization contexts.
 *
 * Hardening references:
 * - `038cfa2` enforce authorize `redirect_uri` and client binding.
 *
 * ## Specification
 * - OAuth 2.0 (RFC 6749) sections 2.3 and 3.1.2.
 * - OAuth 2.0 Mutual-TLS/attestation style client assertions (implementation-specific profile).
 */
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

		if (client_id && client && client.id !== client_id) {
			throw new OauthError(401, "invalid_client", "invalid client credentials");
		}
		if (
			authorization_request &&
			client &&
			client.id !== authorization_request.client_id
		) {
			throw new OauthError(401, "invalid_client", "invalid client credentials");
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

		if (!client?.redirect_uris?.includes(authorization_request.redirect_uri)) {
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
