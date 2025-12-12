import type { DcqlQuery } from "dcql";
import { OauthError } from "../../errors";
import type { ClientMetadata, PresentationRequest } from "../../resources";
import {
	type ValidatePresentationRequestConfig,
	type ValidatePresentationRequestParams,
	validateClientId,
	validateClientMetadata,
	validateDcqlQuery,
	validatePresentationRequest,
} from "../../statements";

export type PresentationRequestConfig = ValidatePresentationRequestConfig;

type PresentationRequestProtocol = "oid4vp";

type PresentationRequestNextStep = "generate_presentation";

export type PresentationRequestLocation = {
	client_id: string;
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
	const presentationRequestParams: ValidatePresentationRequestParams = {
		client_id: location.client_id,
	};
	if (location.request) presentationRequestParams.request = location.request;
	if (location.request_uri)
		presentationRequestParams.request_uri = location.request_uri;

	const { presentation_request } = await validatePresentationRequest(
		presentationRequestParams,
		config,
	);

	// TODO validate client fetching request_uri presentation request
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
