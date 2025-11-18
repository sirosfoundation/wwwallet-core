import crypto from "node:crypto";
import { decodeProtectedHeader, jwtVerify } from "jose";
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

	try {
		await jwtVerify(presentation_request.request, clientCert.publicKey);
	} catch (error) {
		throw new OauthError(
			"invalid_client",
			"presentation request signature does not match x5c header",
			{ error },
		);
	}

	return { client_id: client };
}
