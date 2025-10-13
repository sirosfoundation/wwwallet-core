import { OauthError } from "../../errors";
import type { HttpClient } from "../../ports";
import type { PresentationRequest } from "../../resources";

export type PresentationResponseParams = {
	presentation_request: PresentationRequest;
	vp_token: string;
};

export type PresentationResponseConfig = {
	httpClient: HttpClient;
};

export async function presentationResponse(
	{ presentation_request, vp_token }: PresentationResponseParams,
	config: PresentationResponseConfig,
) {
	try {
		const { redirect_uri } = await config.httpClient
			.post<{ redirect_uri?: string }>(presentation_request.response_uri, {
				vp_token,
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
