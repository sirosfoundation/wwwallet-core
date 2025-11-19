import { decodeJwt } from "jose";
import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";
import type { PresentationRequest } from "../../resources";

export type ValidatePresentationRequestParams = {
	client_id: string;
	request?: string;
	request_uri?: string;
};

export type ValidatePresentationRequestConfig = {
	httpClient: HttpClient;
};

export async function validatePresentationRequest(
	{ client_id, request_uri, request }: ValidatePresentationRequestParams,
	config: ValidatePresentationRequestConfig,
) {
	const presentation_request: PresentationRequest = {
		client_id: client_id || "",
		response_uri: "",
		response_type: "",
		response_mode: "",
		nonce: "",
		state: "",
		client_metadata: null,
		dcql_query: null,
	};

	if (request_uri) {
		presentation_request.request_uri = request_uri;

		try {
			const response = await config.httpClient
				.get<string | PresentationRequest>(request_uri)
				.then(({ data }) => data);
			if (typeof response === "string") {
				const payload = decodeJwt<PresentationRequest>(response);
				presentation_request.request = response;
				Object.assign(presentation_request, payload);
			} else if (typeof response === "object") {
				Object.assign(presentation_request, {
					response_uri: response.response_uri,
					response_type: response.response_type,
					response_mode: response.response_mode,
					nonce: response.nonce,
					state: response.state,
					client_metadata: response.client_metadata || null,
					dcql_query: response.dcql_query || null,
				});
			}
		} catch (error) {
			throw new OauthError(
				"invalid_request",
				"could not fetch presentation request",
				{ error },
			);
		}
	} else if (request) {
		presentation_request.request = request;

		try {
			const payload = decodeJwt<PresentationRequest>(request);
			Object.assign(presentation_request, payload);
		} catch (error) {
			throw new OauthError(
				"invalid_location",
				"could not parse presentation request",
				{ error },
			);
		}
	}

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

	for (const parameter of parameters) {
		if (!presentation_request[parameter]) {
			throw new OauthError(
				"invalid_location",
				`${parameter.replace("_", " ")} parameter is missing`,
			);
		}
	}

	return { presentation_request };
}
