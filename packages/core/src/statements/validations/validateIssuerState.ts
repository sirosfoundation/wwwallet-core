import { OauthError } from "../../errors";
import { jwtDecryptWithConfigKeys, type DecryptConfig } from "../../crypto";

type validateIssuerStateParams = {
	issuer_state: string | undefined;
};

export type ValidateIssuerStateConfig = ({
	issuer_client: {
		id: string;
	};
}
	& DecryptConfig
);

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
