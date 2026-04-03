import type {
	OauthClient,
	SupportedCredentialConfiguration,
} from "../../resources";

export type ValidateCredentialConfigurationsParams = {
	client: OauthClient;
	scope?: string;
};

export type ValidateCredentialConfigurationsConfig = {
	supported_credential_configurations: Array<SupportedCredentialConfiguration>;
};

/**
 * Filters requested credential configuration identifiers by support, client scope, and request scope.
 *
 * ### Why (Security)
 * Scope intersection enforces least privilege and prevents over-issuance.
 *
 * ### Specifications
 * - OpenID4VCI, credential_configuration_id selection
 * - OpenID4VCI, scope to configuration mapping
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 3.3, scope handling
 */
export async function validateCredentialConfigurations(
	credential_configuration_ids: Array<string>,
	{ client, scope: requestedScope }: ValidateCredentialConfigurationsParams,
	config: ValidateCredentialConfigurationsConfig,
) {
	const filteredCredentialConfigurations =
		config.supported_credential_configurations
			.filter((credential_configuration: SupportedCredentialConfiguration) => {
				return credential_configuration_ids.includes(
					credential_configuration.credential_configuration_id,
				);
			})
			// client allows the according credential configuration
			.filter(({ scope }) => client.scopes.includes(scope))
			// given scope allows the credential configuration
			.filter(({ scope }) => requestedScope?.split(" ").includes(scope));

	return { credential_configurations: filteredCredentialConfigurations };
}
