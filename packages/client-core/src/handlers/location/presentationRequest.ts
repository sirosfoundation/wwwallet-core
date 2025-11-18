import type { DcqlQuery } from "dcql";
import { decodeJwt } from "jose";
import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";
import type { ClientMetadata, PresentationRequest } from "../../resources";
import {
	validateClientId,
	validateClientMetadata,
	validateDcqlQuery,
} from "../../statements";

export type PresentationRequestConfig = {
	httpClient: HttpClient;
};

type PresentationRequestProtocol = "oid4vp";

type PresentationRequestNextStep = "generate_presentation";

export type PresentationRequestLocation = {
	client_id: string | null;
	request: string | null;
	request_uri: string | null;
};

export type PresentationRequestResponse = {
	protocol: PresentationRequestProtocol;
	nextStep: PresentationRequestNextStep;
	data: {
		dcql_query: DcqlQuery.Output | null;
		client_metadata: ClientMetadata | null;
		presentation_request: PresentationRequest;
	};
};

const protocol = "oid4vp";
const nextStep = "generate_presentation";

export async function handlePresentationRequest(
	location: PresentationRequestLocation,
	config: PresentationRequestConfig,
): Promise<PresentationRequestResponse> {
	try {
		return await doHandlePresentationRequest(location, config);
	} catch (error) {
		if (error instanceof OauthError) {
			throw error.toResponse({ protocol, nextStep });
		}

		throw error;
	}
}

async function doHandlePresentationRequest(
	location: PresentationRequestLocation,
	config: PresentationRequestConfig,
): Promise<PresentationRequestResponse> {
	const parameters: Array<
		| "request"
		| "client_id"
		| "response_uri"
		| "response_type"
		| "response_mode"
		| "nonce"
		| "state"
	> = [
		"request",
		"client_id",
		"response_uri",
		"response_type",
		"response_mode",
		"nonce",
		"state",
	];

	// TODO validate presentation request statement
	const presentation_request: PresentationRequest = {
		request: location.request || "",
		client_id: location.client_id || "",
		response_uri: "",
		response_type: "",
		response_mode: "",
		nonce: "",
		state: "",
		client_metadata: null,
		dcql_query: null,
	};

	if (location.request_uri) {
		try {
			const response = await config.httpClient
				.get<string>(location.request_uri)
				.then(({ data }) => data);
			presentation_request.request = response;
			// TODO manage raw presentation requests
			const payload = decodeJwt<PresentationRequest>(response);
			Object.assign(presentation_request, payload);
		} catch (error) {
			throw new OauthError(
				"invalid_request",
				"could not fetch presentation request",
				{ error },
			);
		}
	} else if (location.request) {
		try {
			const payload = decodeJwt<PresentationRequest>(location.request);
			Object.assign(presentation_request, payload);
		} catch (error) {
			throw new OauthError(
				"invalid_location",
				"could not parse presentation request",
				{ error },
			);
		}
	}

	for (const parameter of parameters) {
		if (!presentation_request[parameter]) {
			throw new OauthError(
				"invalid_location",
				`${parameter.replace("_", " ")} parameter is missing`,
			);
		}
	}

	const { client_id: _client_id } = await validateClientId(
		{
			presentation_request,
		},
		config,
	);

	const { dcql_query } = await validateDcqlQuery(
		{
			dcql_query: presentation_request.dcql_query,
		},
		config,
	);

	const { client_metadata } = await validateClientMetadata(
		{
			client_metadata: presentation_request.client_metadata,
		},
		config,
	);

	return {
		protocol,
		nextStep,
		data: {
			dcql_query,
			client_metadata,
			presentation_request,
		},
	};
}
