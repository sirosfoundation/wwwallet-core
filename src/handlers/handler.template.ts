import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import { statementTemplate } from "../statements/statementTemplate";
import { handlerTemplateConfigSchema } from "./schemas/handlerTemplateConfig.schema";

const ajv = new Ajv();

export type HandlerTemplateConfig = {};

type TemplateRequest = {};

type TemplateResponse = {
	status: 200;
	data: {};
	body: {};
};

export function handlerTemplateFactory(config: HandlerTemplateConfig) {
	return async function handlerTemplate(
		expressRequest: Request,
	): Promise<TemplateResponse | OauthErrorResponse> {
		try {
			const _request = await validateRequest(expressRequest);

			const _result = await statementTemplate({}, config);

			return {
				status: 200,
				data: {},
				body: {},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				const data = templateErrorData(expressRequest);
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

async function validateRequest(
	_expressRequest: Request,
): Promise<TemplateRequest> {
	return {};
}

function templateErrorData(_expressRequest: Request) {
	return {};
}
