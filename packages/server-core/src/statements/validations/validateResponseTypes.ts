import { OauthError } from "../../errors";
import type { ResponseType } from "../../resources";

export type ValidateResponseTypesParams = {
	response_type: string | undefined;
	response_types_supported?: Array<string>;
};

export type ValidateResponseTypesConfig = unknown;

export async function validateResponseTypes(
	{
		response_type,
		response_types_supported = ["code", "token", "code token"],
	}: ValidateResponseTypesParams,
	_config?: ValidateResponseTypesConfig,
) {
	if (!response_type) {
		throw new OauthError(400, "invalid_request", "response_type is invalid");
	}

	const normalized_response_type = response_type.trim().split(/\s+/).join(" ");
	if (!response_types_supported.includes(normalized_response_type)) {
		throw new OauthError(400, "invalid_request", "response_type is invalid");
	}

	return { response_type: normalized_response_type as ResponseType };
}
