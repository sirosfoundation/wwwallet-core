import type { Request } from "express";
import type { Config } from "..";
import { OauthError } from "../errors";
import type { AuthorizationServerState } from "../resources";
import {
	checkScope,
	generateCredentialOffer,
	generateIssuerGrants,
	issuerClient,
} from "../statements";

type CredentialOfferRequest = {
	scope: string;
	authorizationServerState: AuthorizationServerState;
};

export function credentialOfferFactory(config: Config) {
	return async function credentialOffer(expressRequest: Request) {
		try {
			const request = await validateRequest(expressRequest);

			const { client } = await issuerClient(config);

			const { scope } = await checkScope(request.scope, { client }, config);

			const { authorizationServerState, grants } = await generateIssuerGrants(
				{
					authorizationServerState: request.authorizationServerState,
				},
				config,
			);
			// @ts-ignore
			expressRequest.authorizationServerState = authorizationServerState;

			const { credentialOfferUrl, credentialOfferQrCode } =
				await generateCredentialOffer(
					{ authorizationServerState, grants, scope },
					config,
				);

			return {
				status: 200,
				body: {
					credentialOfferUrl,
					credentialOfferQrCode,
				},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				return error.toResponse();
			}

			throw error;
		}
	};
}

async function validateRequest(
	expressRequest: Request,
): Promise<CredentialOfferRequest> {
	if (!expressRequest.params) {
		throw new OauthError(
			400,
			"bad_request",
			"credential offer requests need path params",
		);
	}

	const { scope } = expressRequest.params;
	// @ts-ignore
	let authorizationServerState = expressRequest.authorizationServerState;

	if (!scope) {
		throw new OauthError(
			400,
			"bad_request",
			"credential offer requests need a scope param",
		);
	}

	if (!authorizationServerState) {
		authorizationServerState = {
			id: 0,
			credential_configuration_ids: [],
			scope: "",
			format: "",
		};
	}

	return { scope, authorizationServerState };
}
