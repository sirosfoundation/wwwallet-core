import * as asn1js from "asn1js";
import { decodeProtectedHeader, jwtVerify } from "jose";
import { Certificate } from "pkijs";
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
				"request uri must have a https scheme",
			);
		}
		if (new URL(presentation_request.request_uri).hostname !== client) {
			throw new OauthError(
				"invalid_request",
				"request uri does not match client host",
			);
		}

		return { client_id: client };
	}

	if (!presentation_request.request) {
		throw new OauthError(
			"invalid_client",
			"x509 san dns presentation requests require a request parameter",
		);
	}

	try {
		const { x5c } = decodeProtectedHeader(presentation_request.request);

		if (!Array.isArray(x5c) || !(typeof x5c[0] === "string")) {
			throw new OauthError(
				"invalid_client",
				"presentation request must contain a x5c header",
			);
		}

		const asn1 = asn1js.fromBER(rawToArrayBuffer(x5c[0]));
		const certificate = new Certificate({ schema: asn1.result });
		const commonName = certificate.subject.typesAndValues
			.find((t) => t.type === "2.5.4.3")
			?.value.valueBlock.value.toLowerCase();

		if (commonName !== client.toLowerCase()) {
			throw new OauthError(
				"invalid_client",
				"client host does not match presentation request",
			);
		}

		await jwtVerify(
			presentation_request.request,
			await certificate.getPublicKey(),
		);
	} catch (error) {
		if (error instanceof OauthError) {
			throw error;
		}

		throw new OauthError(
			"invalid_client",
			"presentation request signature does not match x5c header",
			{ error },
		);
	}

	return { client_id: client };
}

function rawToArrayBuffer(raw: string) {
	const binary = atob(raw);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}
