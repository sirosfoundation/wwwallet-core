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
 * Decrypts and validates `issuer_state` token, including issuer subject match.
 *
 * ## Why
 * Issuer-bound state prevents wallet flows from being replayed or mixed with
 *   requests from a different issuer/client context.
 *
 * ## Specification
 * - OID4VCI authorization code grant with `issuer_state`.
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
