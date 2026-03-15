import { OauthError } from "../../../errors";
import type {
	AuthorizationRequest,
	OauthClient,
	ResourceOwner,
} from "../../../resources";
import {
	generateAccessToken,
	generateAuthorizationCode,
	generateIdToken,
	hybridGrantRedirection,
} from "../../../statements";
import type {
	AuthorizeHandlerConfig,
	AuthorizeResponse,
} from "../authorize.handler";

type HybridGrantResponseParams = {
	request_uri: string;
	authorization_request: AuthorizationRequest;
	client: OauthClient;
	resource_owner: ResourceOwner;
	scope: string;
};

export async function handleHybridGrantResponse(
	params: HybridGrantResponseParams,
	config: AuthorizeHandlerConfig,
): Promise<AuthorizeResponse> {
	const { request_uri, authorization_request, client, resource_owner, scope } =
		params;
	const isOpenidScopeRequested = scope.split(" ").includes("openid");
	if (isOpenidScopeRequested && !authorization_request.nonce) {
		throw new OauthError(
			400,
			"invalid_request",
			"nonce is missing from authorization request",
		);
	}

	const { authorization_code } = await generateAuthorizationCode(
		{
			authorization_request,
			resource_owner,
			scope,
		},
		config,
	);

	const { access_token, expires_in } = await generateAccessToken(
		{
			client,
			scope,
			sub: resource_owner.sub || undefined,
		},
		config,
	);
	const { id_token } = isOpenidScopeRequested
		? await generateIdToken(
				{
					client_id: client.id,
					sub: resource_owner.sub || "",
					nonce: authorization_request.nonce,
					access_token,
					authorization_code,
				},
				config,
			)
		: { id_token: undefined };

	const { location } = await hybridGrantRedirection(
		{
			authorization_request,
			authorization_code,
			access_token,
			expires_in,
			id_token,
		},
		config,
	);

	config.logger.business("authenticate", {
		request_uri,
		authorization_code,
		access_token,
		sub: resource_owner.sub || "",
	});

	return {
		status: 302,
		location,
	};
}
