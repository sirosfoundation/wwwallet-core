import { OauthError } from "../../errors";

export type ValidateGrantTypeParams = {
	grant_type: string | undefined;
	grant_types_supported?: Array<string>;
};

export type ValidateGrantTypeConfig = unknown;

export async function validateGrantType(
	{
		grant_type,
		grant_types_supported = [
			"client_credentials",
			"authorization_code",
			"refresh_token",
		],
	}: ValidateGrantTypeParams,
	_config?: ValidateGrantTypeConfig,
) {
	if (!grant_type || !grant_types_supported.includes(grant_type)) {
		throw new OauthError(400, "invalid_request", "grant_type is not supported");
	}

	return { grant_type };
}
