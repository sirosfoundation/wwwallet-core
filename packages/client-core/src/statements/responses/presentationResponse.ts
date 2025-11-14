import { OauthError } from "../../errors";
import type { HttpClient, VpTokenSigner } from "../../ports";
import type { PresentationRequest } from "../../resources";

export type PresentationResponseParams = {
	presentation_request: PresentationRequest;
	vp_token: string;
};

export type PresentationResponseConfig = {
	httpClient: HttpClient;
	vpTokenSigner: VpTokenSigner;
};

export async function presentationResponse(
	{ presentation_request, vp_token }: PresentationResponseParams,
	config: PresentationResponseConfig,
) {
	if (!config.vpTokenSigner.encryptResponse) {
		throw new OauthError(
			"invalid_client",
			"client configuration must contain vpTokenSigner#encryptResponse",
		);
	}

	try {
		const response = await config.vpTokenSigner.encryptResponse(
			{
				vp_token,
				state: presentation_request.state,
			},
			presentation_request,
		);

		const { redirect_uri } = await config.httpClient
			.post<{ redirect_uri?: string }>(presentation_request.response_uri, {
				response,
				state: presentation_request.state,
			})
			.then(({ data }) => data);

		return { redirect_uri };
	} catch (error) {
		throw new OauthError(
			"invalid_request",
			"could not perform presentation response",
			{ error },
		);
	}
}
