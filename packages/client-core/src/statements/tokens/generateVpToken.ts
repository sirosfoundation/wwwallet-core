import { OauthError } from "../../errors";
import type { VpTokenSigner } from "../../ports";
import type {
	PresentationCredential,
	PresentationRequest,
} from "../../resources";

export type GenerateVpTokenParams = {
	presentation_credentials: Array<PresentationCredential>;
	presentation_request: PresentationRequest;
};

export type GenerateVpTokenConfig = {
	vpTokenSigner: VpTokenSigner;
};

export async function generateVpToken(
	{ presentation_credentials, presentation_request }: GenerateVpTokenParams,
	config: GenerateVpTokenConfig,
) {
	if (!config.vpTokenSigner.sign) {
		throw new OauthError(
			"invalid_client",
			"client configuration must contain vpTokenSigner#sign",
		);
	}

	const vpTokenPayload: Record<string, Array<string>> = {};

	presentation_credentials.forEach((presentation_credential) => {
		if (!presentation_credential.credential_id) return;

		vpTokenPayload[presentation_credential.credential_id] =
			vpTokenPayload[presentation_credential.credential_id] || [];
		vpTokenPayload[presentation_credential.credential_id].push(
			presentation_credential.credential,
		);
	});

	try {
		const vp_token = await config.vpTokenSigner.sign(
			vpTokenPayload,
			presentation_request,
		);

		return { vp_token };
	} catch (error) {
		throw new OauthError("invalid_client", "could not sign vp token", {
			error,
		});
	}
}
