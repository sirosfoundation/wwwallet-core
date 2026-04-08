import { EncryptJWT } from "jose";
import type {
	Grants,
	OauthClient,
	SupportedCredentialConfiguration,
} from "../../resources";

export type GenerateIssuerGrantsParams = {
	client: OauthClient;
	scope: string;
};

export type GenerateIssuerGrantsConfig = {
	secret: string;
	token_encryption: string;
	issuer_state_ttl: number;
	supported_credential_configurations: Array<SupportedCredentialConfiguration>;
};

/**
 * Generates issuer grants including issuer_state for the authorization code initiation.
 *
 * ### Why (Security)
 * Protected issuer_state reduces forgery and grant-context tampering.
 *
 * ### Specifications
 * - OpenID4VCI, grants.authorization_code.issuer_state
 * - RFC 6749 (OAuth 2.0 Authorization Framework) Section 4.1, authorization code grant
 * - JWT or JWE protected state token profile
 */
export async function generateIssuerGrants(
	{ client, scope }: GenerateIssuerGrantsParams,
	config: GenerateIssuerGrantsConfig,
) {
	const now = Date.now() / 1000;

	const secret = new TextEncoder().encode(config.secret);

	const credentialConfigurations =
		config.supported_credential_configurations.filter((configuration) => {
			return scope.split(" ").includes(configuration.scope);
		});

	const grants: Grants = {};

	if (credentialConfigurations.every(({ preauthorized }) => preauthorized)) {
		const preauthorized_code = await new EncryptJWT({
			token_type: "preauthorized_code",
			client_id: client.id,
			sub: "preauthorized",
			scope,
		})
			.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
			.setIssuedAt()
			.setExpirationTime(now + config.issuer_state_ttl)
			.encrypt(secret);
		grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"] = {
			"pre-authorized_code": preauthorized_code,
		};
	} else {
		const issuer_state = await new EncryptJWT({ sub: client.id })
			.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
			.setIssuedAt()
			.setExpirationTime(now + config.issuer_state_ttl)
			.encrypt(secret);
		grants.authorization_code = {
			issuer_state,
		};
	}

	return { grants };
}
