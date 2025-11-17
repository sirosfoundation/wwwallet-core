import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError } from "../errors";
import { statementTemplate } from "../statements/_statementTemplate";
import { handlerTemplateConfigSchema } from "./schemas/_handlerTemplateConfig.schema";

const ajv = new Ajv();

export type HandlerTemplateParams = {};

export type HandlerTemplateConfig = {};

type HandlerTemplateProtocol = "protocol";

type HandlerTemplateNextStep = "next_step";

type TemplateRequest = {};

type TemplateResponse = {
	protocol: HandlerTemplateProtocol;
	nextStep?: HandlerTemplateNextStep;
	data?: {};
};

const protocol = "protocol";
const currentStep = "current_step";
const nextStep = "next_step";

export function handlerTemplateFactory(config: HandlerTemplateConfig) {
	return async function handlerTemplate(
		params: HandlerTemplateParams,
	): Promise<TemplateResponse> {
		try {
			const _request = await unit(params);

			const _result = await statementTemplate({}, config);

			return {
				protocol,
				nextStep,
			};
		} catch (error) {
			if (error instanceof OauthError) {
				const data = templateErrorData({ protocol, currentStep, nextStep });
				throw error.toResponse(data);
			}

			throw error;
		}
	};
}

export function validateHandlerTemplateConfig(config: Config) {
	const validate = ajv.compile(handlerTemplateConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}

async function unit(_params: unknown): Promise<TemplateRequest> {
	return {};
}

function templateErrorData({
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
