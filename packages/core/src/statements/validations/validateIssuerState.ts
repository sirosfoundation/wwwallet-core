import { jwtDecrypt } from "jose";
import { JWEDecryptionFailed } from "jose/errors";
import { OauthError } from "../../errors";

type validateIssuerStateParams = {
	issuer_state: string | undefined;
};

export type ValidateIssuerStateConfig = {
	secret: string;
	previous_secrets: Array<string>;
	issuer_client: {
		id: string;
	};
};

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
		} = await jwtDecrypt<{ sub: string }>(
			issuer_state,
			new TextEncoder().encode(config.secret),
		).catch((error) => {
			if (error instanceof JWEDecryptionFailed) {
				return jwtDecrypt<{ sub: string }>(
					issuer_state,
					new TextEncoder().encode(config.previous_secrets[0]),
				);
			}

			throw error;
		});

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
