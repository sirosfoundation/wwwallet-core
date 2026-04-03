import { type DecryptConfig, jwtDecryptWithConfigKeys } from "../../crypto";
import { OauthError } from "../../errors";

export type validateIssuerStateParams = {
	issuer_state: string | undefined;
};

export type ValidateIssuerStateConfig = {
	issuer_client: {
		id: string;
	};
} & DecryptConfig;

/**
 * Validates issuer_state token integrity and issuer binding.
 *
 * ### Why (Security)
 * Issuer binding prevents cross-issuer state reuse and flow confusion.
 *
 * ### Specifications
 * - OpenID4VCI, issuer_state in authorization code grant
 * - OAuth state-style correlation semantics
 * - JWT or JWE protected state validation
 */
export async function validateIssuerState(
	{ issuer_state }: validateIssuerStateParams,
	config: ValidateIssuerStateConfig,
) {
	if (!issuer_state) {
		throw new OauthError(
			400,
			"invalid_request",
			"issuer state must be defined",
		);
	}

	try {
		const {
			payload: { sub },
		} = await jwtDecryptWithConfigKeys<{ sub: string }>(issuer_state, config);

		if (sub !== config.issuer_client.id) {
			throw new OauthError(400, "invalid_request", "issuer state is invalid");
		}

		return {
			issuer_state,
		};
	} catch (_error) {
		throw new OauthError(400, "invalid_request", "issuer state is invalid");
	}
}
