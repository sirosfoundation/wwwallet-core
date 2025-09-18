import { decodeJwt } from "jose";
import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";

export type PresentationRequestConfig = {
	httpClient: HttpClient;
};

type PresentationRequestProtocol = "oid4vp";

type PresentationRequestNextStep = "presentation";

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
	dcql_query?: string;
	scope?: string;
};

export type PresentationRequestResponse = {
	protocol: PresentationRequestProtocol;
	nextStep: PresentationRequestNextStep;
	data: {
		client_id: string;
		response_uri: string;
		response_type: string;
		response_mode: string;
		nonce: string;
		state: string;
		dcql_query?: string;
		scope?: string;
	};
};

const protocol = "oid4vp";
const nextStep = "presentation";

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

	let request: PresentationRequest = {
		client_id: "",
		response_uri: "",
		response_type: "",
		response_mode: "",
		nonce: "",
		state: "",
	};
	try {
		if (location.request_uri) {
			const payload = await config.httpClient
				.get<PresentationRequest>(location.request_uri)
				.then(({ data }) => data);
			request = payload;
		} else if (location.request) {
			const payload = decodeJwt<PresentationRequest>(location.request);
			request = payload;
		} else {
			for (const parameter of parameters) {
				if (location[parameter]) {
					request[parameter] = location[parameter];
				}
			}
		}
	} catch (_error) {
		throw new OauthError(
			"invalid_location",
			"could not parse presentation request",
		);
	}

	for (const parameter of parameters) {
		if (!request[parameter]) {
			throw new OauthError(
				"invalid_location",
				`${parameter.replace("_", " ")} parameter is missing`,
			);
		}
	}

	return {
		protocol,
		nextStep,
		data: request,
	};
}
