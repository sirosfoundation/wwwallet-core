import crypto from "node:crypto";
import { decodeProtectedHeader, jwtVerify } from "jose";
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
 * Validates client identity using one authentication method per request
 *   (`client_secret` or `oauth_client_attestation`) plus redirect/client
 *   binding checks for public-code flows.
 *
 * ## Why
 * Every OAuth/OIDC flow depends on trustworthy client identity before issuing
 *   tokens or accepting pushed authorization requests, including strict
 *   `redirect_uri` and `client_id` binding for authorization contexts.
 * Mixed authentication methods are rejected to avoid ambiguous or conflicting
 *   credential evaluation paths.
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
	const clientAuthenticationMethodsCount = [
		client_secret !== undefined,
		oauth_client_attestation !== undefined,
	].filter(Boolean).length;
	if (clientAuthenticationMethodsCount > 1) {
		throw new OauthError(401, "invalid_client", "invalid client credentials");
	}

	if (oauth_client_attestation) {
		const normalizedAttestation = oauth_client_attestation.trim();
		if (
			normalizedAttestation.length === 0 ||
			normalizedAttestation.includes(",")
		) {
			throw new OauthError(401, "invalid_client", "invalid client credentials");
		}

		let found = false;
		for (const certificate of config.trusted_root_certificates) {
			try {
				const { typ } = decodeProtectedHeader(normalizedAttestation);
				if (typ !== "oauth-client-attestation+jwt") {
					throw new OauthError(
						401,
						"invalid_client",
						"invalid client credentials",
					);
				}

				const { publicKey } = new crypto.X509Certificate(certificate);
				const { payload } = await jwtVerify(normalizedAttestation, publicKey);

				client = config.clients.find(({ id }) => id === payload.sub);
				found = !!client;
			} catch (error) {
				if (error instanceof OauthError) {
					throw error;
				}
			}
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
