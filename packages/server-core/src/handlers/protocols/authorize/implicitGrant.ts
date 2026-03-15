import type {
	AuthorizationRequest,
	OauthClient,
	ResourceOwner,
} from "../../../resources";
import { OauthError } from "../../../errors";
import {
	generateAccessToken,
	generateIdToken,
	implicitGrantRedirection,
} from "../../../statements";
import type {
	AuthorizeHandlerConfig,
	AuthorizeResponse,
} from "../authorize.handler";

type ImplicitGrantResponseParams = {
	request_uri: string;
	authorization_request: AuthorizationRequest;
	client: OauthClient;
	resource_owner: ResourceOwner;
	scope: string;
};

export async function handleImplicitGrantResponse(
	params: ImplicitGrantResponseParams,
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
				},
				config,
			)
		: { id_token: undefined };

	const { location } = await implicitGrantRedirection(
		{
			authorization_request,
			access_token,
			expires_in,
			id_token,
		},
		config,
	);

	config.logger.business("authenticate", {
		request_uri,
		access_token,
		sub: resource_owner.sub || "",
	});

	return {
		status: 302,
		location,
	};
}
