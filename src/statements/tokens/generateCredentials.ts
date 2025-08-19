export type GenerateCredentialsParams = {
	credential_configuration_ids: Array<string>;
};

export type GenerateCredentialsConfig = {};

export async function generateCredentials(
	{
		credential_configuration_ids: _credential_configuration_ids,
	}: GenerateCredentialsParams,
	_config: GenerateCredentialsConfig,
) {
	return {
		credentials: [],
	};
}
