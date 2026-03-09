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
 * Filters requested credential configurations by issuer support, client scopes,
 * and requested scope.
 *
 * Why:
 * - Issuers must ensure requested credential types are both issuer-supported
 *   and authorized for the calling client + granted scope set.
 *
 * Specification:
 * - OID4VCI credential authorization and scope-based access model.
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
