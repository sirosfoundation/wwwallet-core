import type { DcqlQuery } from "dcql";
import { decodeJwt } from "jose";
import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";
import type { PresentationRequest } from "../../resources";
import { validateDcqlQuery } from "../../statements";

export type PresentationRequestConfig = {
	httpClient: HttpClient;
};

type PresentationRequestProtocol = "oid4vp";

type PresentationRequestNextStep = "generate_presentation";

export type PresentationRequestLocation = {
	client_id: string | null;
	response_uri: string | null;
	response_type: string | null;
	response_mode: string | null;
	nonce: string | null;
	state: string | null;
	dcql_query: string | null;
	scope: string | null;
	request: string | null;
	request_uri: string | null;
};

export type PresentationRequestResponse = {
	protocol: PresentationRequestProtocol;
	nextStep: PresentationRequestNextStep;
	data: {
		dcql_query: DcqlQuery.Output | null;
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
		| "client_id"
		| "response_uri"
		| "response_type"
		| "response_mode"
		| "nonce"
		| "state"
	> = [
		"client_id",
		"response_uri",
		"response_type",
		"response_mode",
		"nonce",
		"state",
	];

	const presentation_request: PresentationRequest = {
		client_id: location.client_id || "",
		response_uri: "",
		response_type: "",
		response_mode: "",
		nonce: "",
		state: "",
		dcql_query: null,
	};

	if (location.request_uri) {
		try {
			const response = await config.httpClient
				.get<string>(location.request_uri)
				.then(({ data }) => data);
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
	} else {
		for (const parameter of parameters) {
			if (location[parameter]) {
				presentation_request[parameter] = location[parameter];
			}
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

	const { dcql_query } = await validateDcqlQuery(
		{
			dcql_query: presentation_request.dcql_query,
		},
		config,
	);

	return {
		protocol,
		nextStep,
		data: {
			dcql_query,
			presentation_request,
		},
	};
}
