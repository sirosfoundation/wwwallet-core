import type { AuthorizationRequest, ResourceOwner } from "../../../resources";
import {
	authorizationCodeRedirection,
	generateAuthorizationCode,
} from "../../../statements";
import type {
	AuthorizeHandlerConfig,
	AuthorizeResponse,
} from "../authorize.handler";

type AuthorizationCodeResponseParams = {
	request_uri: string;
	authorization_request: AuthorizationRequest;
	resource_owner: ResourceOwner;
	scope: string;
};

export async function handleAuthorizationCodeResponse(
	params: AuthorizationCodeResponseParams,
	config: AuthorizeHandlerConfig,
): Promise<AuthorizeResponse> {
	const { request_uri, authorization_request, resource_owner, scope } = params;

	const { authorization_code } = await generateAuthorizationCode(
		{
			authorization_request,
			resource_owner,
			scope,
		},
		config,
	);

	// TODO add state parameter
	const { location } = await authorizationCodeRedirection(
		{ authorization_request, authorization_code },
		config,
	);

	config.logger.business("authenticate", {
		request_uri,
		authorization_code,
		sub: resource_owner.sub || "",
	});

	return {
		status: 302,
		location,
	};
}
