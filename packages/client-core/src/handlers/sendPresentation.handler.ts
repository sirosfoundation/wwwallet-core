import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError } from "../errors";
import type { PresentationRequest } from "../resources";
import {
	type PresentationResponseConfig,
	presentationResponse,
} from "../statements";
import { sendPresentationConfigSchema } from "./schemas";

const ajv = new Ajv();

export type SendPresentationParams = {
	presentation_request: PresentationRequest;
	vp_token: string;
};

export type SendPresentationConfig = PresentationResponseConfig;

type SendPresentationProtocol = "oid4vp";

type SendPresentationNextStep = "presentation_success";

type SendPresentationResponse = {
	protocol: SendPresentationProtocol;
	nextStep?: SendPresentationNextStep;
	data: {
		redirect_uri?: string;
	};
};

const protocol = "oid4vp";
const currentStep = "send_presentation";
const nextStep = "presentation_success";

export function sendPresentationHandlerFactory(config: SendPresentationConfig) {
	return async function sendPresentationHandler({
		presentation_request,
		vp_token,
	}: SendPresentationParams): Promise<SendPresentationResponse> {
		try {
			const { redirect_uri } = await presentationResponse(
				{
					presentation_request,
					vp_token,
				},
				config,
			);

			return {
				protocol,
				nextStep,
				data: {
					redirect_uri,
				},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				const data = sendPresentationErrorData({
					protocol,
					currentStep,
					nextStep,
				});
				throw error.toResponse(data);
			}

			throw error;
		}
	};
}

export function validateSendPresentationHandlerConfig(config: Config) {
	const validate = ajv.compile(sendPresentationConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler send presentation configuration - ${errorText}`,
		);
	}
}

function sendPresentationErrorData({
	protocol,
	currentStep,
	nextStep,
}: {
	protocol: string;
	currentStep: string;
	nextStep: string;
}) {
	return { protocol, currentStep, nextStep };
}
