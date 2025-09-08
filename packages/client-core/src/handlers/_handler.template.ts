import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import { statementTemplate } from "../statements/_statementTemplate";
import { handlerTemplateConfigSchema } from "./schemas/_handlerTemplateConfig.schema";

const ajv = new Ajv();

export type HandlerTemplateConfig = {};

type TemplateRequest = {};

type TemplateResponse = {
	protocol: string | null;
	nextStep?: string;
	data?: {};
};

export function handlerTemplateFactory(config: HandlerTemplateConfig) {
	return async function handlerTemplate(
		params: unknown,
	): Promise<TemplateResponse | OauthErrorResponse> {
		try {
			const _request = await unit(params);

			const _result = await statementTemplate({}, config);

			return {
				protocol: null,
			};
		} catch (error) {
			if (error instanceof OauthError) {
				const data = templateErrorData(params);
				return error.toResponse(data);
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

function templateErrorData(_params: unknown) {
	return {};
}
