import type { CredentialConfiguration, OauthClient } from "../../resources";

export type ValidateCredentialConfigurationsParams = {
	client: OauthClient;
	scope?: string;
};

export type ValidateCredentialConfigurationsConfig = {
	supported_credential_configurations: Array<CredentialConfiguration>;
};

export async function validateCredentialConfigurations(
	credential_configuration_ids: Array<string>,
	{ client, scope: requestedScope }: ValidateCredentialConfigurationsParams,
	config: ValidateCredentialConfigurationsConfig,
) {
	const filteredCredentialConfigurationIds =
		config.supported_credential_configurations
			.filter((credential_configuration: CredentialConfiguration) => {
				return credential_configuration_ids.includes(
					credential_configuration.credential_configuration_id,
				);
			})
			// client allows the according credential configuration
			.filter(({ scope }) => client.scopes.includes(scope))
			// given scope allows the credential configuration
			.filter(({ scope }) => requestedScope?.split(" ").includes(scope))
			.map(({ credential_configuration_id }) => credential_configuration_id);

	return { credential_configuration_ids: filteredCredentialConfigurationIds };
}
