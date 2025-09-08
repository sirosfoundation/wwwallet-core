import { OauthError } from "../../errors";

export type PresentationSuccessConfig = {};

type CredentialOfferProtocol = "oid4vp";

type PresentationSuccessNextStep = "presentation_success";

export type PresentationSuccessLocation = {
	code: string | null;
};

export type PresentationSuccessProtocolResponse = {
	protocol: CredentialOfferProtocol;
	nextStep: PresentationSuccessNextStep;
	data: {
		code: string;
	};
};

const protocol = "oid4vp";
const nextStep = "presentation_success";

export async function handlePresentationSuccess(
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
