import { OauthError } from "../../errors";

export type ProtocolErrorConfig = {};

type CredentialOfferProtocol = "oauth";

type ProtocolErrorNextStep = "protocol_error";

export type ProtocolErrorLocation = {
	error: string | null;
	error_description: string | null;
};

export type ProtocolErrorResponse = {
	protocol: CredentialOfferProtocol;
	nextStep: ProtocolErrorNextStep;
	data: {
		error: string;
		error_description: string | null;
	};
};

const protocol = "oauth";
const nextStep = "protocol_error";

export async function handleProtocolError(
	location: ProtocolErrorLocation,
	_config: ProtocolErrorConfig,
): Promise<ProtocolErrorResponse> {
	if (!location.error) {
		throw new OauthError(400, "invalid_location", "error parameter is missing");
	}

	return {
		protocol,
		nextStep,
		data: {
			error: location.error,
			error_description: location.error_description,
		},
	};
}
