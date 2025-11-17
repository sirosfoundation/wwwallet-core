import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError } from "../errors";
import {
	type AuthorizationCodeConfig,
	type AuthorizationCodeResponse,
	handleAuthorizationCode,
} from "./location/authorizationCode";
import {
	type CredentialOfferLocationConfig,
	type CredentialOfferResponse,
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
	type PresentationSuccessResponse,
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

export type LocationHandlerParams = Location;

type ProtocolLocation = {
	credential_offer: string | null;
	code: string | null;
	error: string | null;
	error_description: string | null;
	client_id: string | null;
	request: string | null;
	request_uri: string | null;
	state: string | null;
};

export type NoProtocolResponse = {
	protocol: null;
};

export type LocationResponse =
	| CredentialOfferResponse
	| PresentationSuccessResponse
	| PresentationRequestResponse
	| AuthorizationCodeResponse
	| ProtocolErrorResponse
	| NoProtocolResponse;

const currentStep = "parse_location";

export function locationHandlerFactory(config: LocationHandlerConfig) {
	return async function locationHandler(
		windowLocation: LocationHandlerParams,
	): Promise<LocationResponse> {
		try {
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
		} catch (error) {
			if (error instanceof OauthError) {
				const data = locationErrorData({
					currentStep,
					location: windowLocation.href,
				});
				throw error.toResponse(data);
			}

			throw error;
		}
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
	const request = searchParams.get("request");
	const request_uri = searchParams.get("request_uri");
	const state = searchParams.get("state");

	return {
		credential_offer,
		code,
		error,
		error_description,
		client_id,
		request,
		request_uri,
		state,
	};
}

function locationErrorData({
	currentStep,
	location,
}: {
	currentStep: string;
	location: string;
}) {
	return { currentStep, location };
}
