import crypto from "node:crypto";
import { decodeProtectedHeader } from "jose";
import { OauthError } from "../../errors";
import type { PresentationRequest } from "../../resources";

export type ValidateClientIdParams = {
	presentation_request: PresentationRequest;
};

export type ValidateClientIdConfig = {};

const supportedClientIdPrefixes = ["x509_san_dns"];

export async function validateClientId(
	{ presentation_request }: ValidateClientIdParams,
	_config: ValidateClientIdConfig,
) {
	const clientIdParts = presentation_request.client_id.split(":");

	if (!supportedClientIdPrefixes.includes(clientIdParts[0])) {
		throw new OauthError("invalid_client", "client id prefix not supported");
	}

	const client_id_prefix = clientIdParts[0];

	if (!clientIdParts[1]) {
		throw new OauthError("invalid_client", "invalid client id");
	}
	const client = clientIdParts[1];

	if (client_id_prefix === "x509_san_dns") {
		return await validateX509ClientId(client, presentation_request);
	}

	throw new OauthError("invalid_client", "client id prefix not supported");
}

async function validateX509ClientId(
	client: string,
	presentation_request: PresentationRequest,
) {
	if (presentation_request.request_uri && !presentation_request.request) {
		if (!presentation_request.request_uri?.startsWith("https")) {
			throw new OauthError(
				"invalid_request",
				"request uri must have a https scheme"
			)
		}
		if (new URL(presentation_request.request_uri).hostname !== client) {
			throw new OauthError(
				"invalid_request",
				"request uri does not match client host"
			)
		}

		return { client_id: client }
	}

	if (!presentation_request.request) {
		throw new OauthError("invalid_client", "x509 san dns presentation requests require a request parameter")
	}

	try {
		const { x5c } = decodeProtectedHeader(presentation_request.request);

		if (!Array.isArray(x5c) || !(typeof x5c[0] === "string")) {
			throw new OauthError(
				"invalid_client",
				"presentation request must contain a x5c header",
			);
		}

		const clientCert = new crypto.X509Certificate(Buffer.from(x5c[0], "base64"));

		if (!clientCert.checkHost(client)) {
			throw new OauthError(
				"invalid_client",
				"client host does not match presentation request",
			);
		}

		return { client_id: client };
	} catch (error) {
		if (error instanceof OauthError) {
			throw error
		}

		throw new OauthError(
			"invalid_client",
			"could not parse presentation request x5c header",
			{ error },
		)
	}
}
