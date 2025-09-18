import { OauthError } from "../../errors";

export type PresentationSuccessConfig = {};

type PresentationSuccessProtocol = "oid4vp";

type PresentationSuccessNextStep = "presentation_success";

export type PresentationSuccessLocation = {
	code: string | null;
};

export type PresentationSuccessProtocolResponse = {
	protocol: PresentationSuccessProtocol;
	nextStep: PresentationSuccessNextStep;
	data: {
		code: string;
	};
};

const protocol = "oid4vp";
const nextStep = "presentation_success";

export async function handlePresentationSuccess(
	location: PresentationSuccessLocation,
	config: PresentationSuccessConfig,
): Promise<PresentationSuccessProtocolResponse> {
	try {
		return await doHandlePresentationSuccess(location, config);
	} catch (error) {
		if (error instanceof OauthError) {
			throw error.toResponse({ protocol, nextStep });
		}

		throw error;
	}
}

async function doHandlePresentationSuccess(
	location: PresentationSuccessLocation,
	_config: PresentationSuccessConfig,
): Promise<PresentationSuccessProtocolResponse> {
	if (!location.code) {
		throw new OauthError(400, "invalid_location", "code parameter is missing");
	}

	return {
		protocol,
		nextStep,
		data: {
			code: location.code,
		},
	};
}
