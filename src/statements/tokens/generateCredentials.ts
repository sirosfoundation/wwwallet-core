export type GenerateCredentialsParams = {
	sub: string;
	credential_configuration_ids: Array<string>;
};

export type GenerateCredentialsConfig = {};

export async function generateCredentials(
	{
		sub: _sub,
		credential_configuration_ids: _credential_configuration_ids,
	}: GenerateCredentialsParams,
	_config: GenerateCredentialsConfig,
) {
	return {
		credentials: [],
	};
}
