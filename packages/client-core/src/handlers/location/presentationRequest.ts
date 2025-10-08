import { decodeJwt } from "jose";
import { OauthError } from "../../errors";
import type { HttpClient, PresentationCredentialsStore } from "../../ports";
import type { PresentationCredential } from "../../resources";
import { validateDcqlQuery } from "../../statements";

export type PresentationRequestConfig = {
	httpClient: HttpClient;
	presentationCredentialsStore: PresentationCredentialsStore;
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

type PresentationRequest = {
	client_id: string;
	response_uri: string;
	response_type: string;
	response_mode: string;
	nonce: string;
	state: string;
	dcql_query: string | null;
	scope?: string;
};

export type PresentationRequestResponse = {
	protocol: PresentationRequestProtocol;
	nextStep: PresentationRequestNextStep;
	data: {
		presentation_credentials: Array<PresentationCredential>;
		client_id: string;
		response_uri: string;
		response_type: string;
		response_mode: string;
		nonce: string;
		state: string;
		dcql_query: string | null;
		scope?: string;
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

	const request: PresentationRequest = {
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
			Object.assign(request, payload);
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
			Object.assign(request, payload);
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
				request[parameter] = location[parameter];
			}
		}
	}

	for (const parameter of parameters) {
		if (!request[parameter]) {
			throw new OauthError(
				"invalid_location",
				`${parameter.replace("_", " ")} parameter is missing`,
			);
		}
	}

	const { dcql_query } = await validateDcqlQuery(
		{
			dcql_query: request.dcql_query,
		},
		config,
	);

	const presentation_credentials =
		await config.presentationCredentialsStore.fromDcqlQuery(dcql_query);

	return {
		protocol,
		nextStep,
		data: {
			presentation_credentials,
			...request,
		},
	};
}
