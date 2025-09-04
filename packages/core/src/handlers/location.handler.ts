import Ajv from "ajv";
import type { Config } from "../config";
import {
	type CredentialOfferLocationConfig,
	type CredentialOfferProtocolResponse,
	handleCredentialOffer,
} from "./location/credentialOffer";
import {
	handlePresentationSuccess,
	type PresentationSuccessConfig,
	type PresentationSuccessProtocolResponse,
} from "./location/presentationSuccess";
import {
	handleProtocolError,
	type ProtocolErrorResponse,
} from "./location/protocolError";
import { locationHandlerConfigSchema } from "./schemas/locationHandlerConfig.schema";

const ajv = new Ajv();

export type LocationHandlerConfig = CredentialOfferLocationConfig &
	PresentationSuccessConfig;

type ProtocolLocation = {
	credential_offer: string | null;
	code: string | null;
	error: string | null;
	error_description: string | null;
};

type NoProtocol = {
	protocol: null;
};

type ProtocolResponse =
	| CredentialOfferProtocolResponse
	| PresentationSuccessProtocolResponse
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

		if (location.code) {
			return await handlePresentationSuccess(location, config);
		}

		if (location.credential_offer) {
			return await handleCredentialOffer(location, config);
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
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}

async function parseLocation(
	windowLocation: Location,
): Promise<ProtocolLocation> {
	const searchParams = new URLSearchParams(windowLocation.search);

	const credential_offer = searchParams.get("credential_offer");
	const code = searchParams.get("code");
	const error = searchParams.get("error");
	const error_description = searchParams.get("error_description");

	return {
		credential_offer,
		code,
		error,
		error_description,
	};
}
