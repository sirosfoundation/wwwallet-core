import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError } from "../errors";
import type { PresentationCredential, PresentationRequest } from "../resources";
import { type GenerateVpTokenConfig, generateVpToken } from "../statements";
import { generatePresentationConfigSchema } from "./schemas";

const ajv = new Ajv();

export type GeneratePresentationParams = {
	presentation_credentials: Array<PresentationCredential>;
	presentation_request: PresentationRequest;
};

export type GeneratePresentationConfig = GenerateVpTokenConfig;

type GeneratePresentationProtocol = "oid4vp";

type GeneratePresentationNextStep = "send_presentation";

export type GeneratePresentationResponse = {
	protocol: GeneratePresentationProtocol;
	nextStep: GeneratePresentationNextStep;
	data: {
		vp_token: string;
		presentation_request: PresentationRequest;
	};
};

const protocol = "oid4vp";
const currentStep = "generate_presentation";
const nextStep = "send_presentation";

export function generatePresentationHandlerFactory(
	config: GeneratePresentationConfig,
) {
	return async function generatePresentation({
		presentation_credentials,
		presentation_request,
	}: GeneratePresentationParams): Promise<GeneratePresentationResponse> {
		try {
			const { vp_token } = await generateVpToken(
				{
					presentation_credentials,
					presentation_request,
				},
				config,
			);

			return {
				protocol,
				nextStep,
				data: {
					vp_token,
					presentation_request,
				},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				const data = generatePresentationErrorData({
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

export function validateGeneratePresentationHandlerConfig(config: Config) {
	const validate = ajv.compile(generatePresentationConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler generate presentation configuration - ${errorText}`,
		);
	}
}

function generatePresentationErrorData({
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
