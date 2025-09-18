import { OauthError } from "../errors";

export type StatementTemplateParams = {};

export type StatementTemplateConfig = {};

export async function statementTemplate(
	_params: StatementTemplateParams,
	_config: StatementTemplateConfig,
): Promise<unknown> {
	const condition = true;

	if (!condition) {
		throw new OauthError("invalid_request", "condition is not met");
	}

	return {};
}
