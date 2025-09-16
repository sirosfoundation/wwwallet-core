import Ajv from "ajv";
import type { Config } from "../config";
import {
	type AuthorizationCodeConfig,
	type AuthorizationCodeResponse,
	handleAuthorizationCode,
} from "./location/authorizationCode";
import {
	type CredentialOfferLocationConfig,
	type CredentialOfferProtocolResponse,
	handleCredentialOffer,
} from "./location/credentialOffer";
import {
	handlePresentationRequest,
	type PresentationRequestConfig,
	type PresentationRequestResponse,
} from "./location/presentationRequest";
import {
	handlePresentationSuccess,
	type PresentationSuccessConfig,
	type PresentationSuccessProtocolResponse,
} from "./location/presentationSuccess";
import {
	handleProtocolError,
	type ProtocolErrorConfig,
	type ProtocolErrorResponse,
} from "./location/protocolError";
import { locationHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type LocationHandlerConfig = CredentialOfferLocationConfig &
	PresentationSuccessConfig &
	PresentationRequestConfig &
	AuthorizationCodeConfig &
	ProtocolErrorConfig;

type ProtocolLocation = {
	credential_offer: string | null;
	code: string | null;
	error: string | null;
	error_description: string | null;
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

type NoProtocol = {
	protocol: null;
};

type ProtocolResponse =
	| CredentialOfferProtocolResponse
	| PresentationSuccessProtocolResponse
	| PresentationRequestResponse
	| AuthorizationCodeResponse
	| ProtocolErrorResponse
	| NoProtocol;

export function locationHandlerFactory(config: LocationHandlerConfig) {
	return async function locationHandler(
		windowLocation: Location,
	): Promise<ProtocolResponse> {
		const location = await parseLocation(windowLocation);

		if (location.error) {
			return await handleProtocolError(location, config);
		}

		if (location.code && location.state) {
			return await handleAuthorizationCode(location, config);
		}

		if (location.code) {
			return await handlePresentationSuccess(location, config);
		}

		if (location.credential_offer) {
			return await handleCredentialOffer(location, config);
		}

		if (location.client_id) {
			return await handlePresentationRequest(location, config);
		}

		return {
			protocol: null,
		};
	};
}

export function validateLocationHandlerConfig(config: Config) {
	const validate = ajv.compile(locationHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate location handler configuration - ${errorText}`,
		);
	}
}

async function parseLocation(
	windowLocation: Location,
): Promise<ProtocolLocation> {
	const searchParams = new URLSearchParams(windowLocation.search);

	const credential_offer = searchParams.get("credential_offer");
	const error = searchParams.get("error");
	const error_description = searchParams.get("error_description");
	const code = searchParams.get("code");
	const client_id = searchParams.get("client_id");
	const response_uri = searchParams.get("response_uri");
	const response_type = searchParams.get("response_type");
	const response_mode = searchParams.get("response_mode");
	const nonce = searchParams.get("nonce");
	const state = searchParams.get("state");
	const dcql_query = searchParams.get("dcql_query");
	const scope = searchParams.get("scope");
	const request = searchParams.get("request");
	const request_uri = searchParams.get("request_uri");

	return {
		credential_offer,
		code,
		error,
		error_description,
		client_id,
		response_uri,
		response_type,
		response_mode,
		nonce,
		state,
		dcql_query,
		scope,
		request,
		request_uri,
	};
}
