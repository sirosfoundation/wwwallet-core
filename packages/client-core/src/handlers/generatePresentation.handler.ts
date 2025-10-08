import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError } from "../errors";
import { generatePresentationConfigSchema } from "./schemas";

const ajv = new Ajv();

export type GeneratePresentationParams = {};

export type GeneratePresentationConfig = {};

type GeneratePresentationProtocol = "oid4vp";

type GeneratePresentationNextStep = "send_presentation";

type GeneratePresentationRequest = {};

type TemplateResponse = {
	protocol: GeneratePresentationProtocol;
	nextStep: GeneratePresentationNextStep;
	data?: {};
};

const protocol = "oid4vp";
const currentStep = "generate_presentation";
const nextStep = "send_presentation";

export function generatePresentationHandlerFactory(
	_config: GeneratePresentationConfig,
) {
	return async function generatePresentation(
		params: GeneratePresentationParams,
	): Promise<TemplateResponse> {
		try {
			const _request = await unit(params);

			return {
				protocol,
				nextStep,
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

async function unit(_params: unknown): Promise<GeneratePresentationRequest> {
	return {};
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
