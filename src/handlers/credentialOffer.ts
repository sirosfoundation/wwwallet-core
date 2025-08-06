import type { Request } from "express";
import type { Config } from "..";
import { OauthError } from "../errors";
import {
	checkScope,
	credentialOfferHandler,
	generateIssuerGrants,
	issuerClient,
} from "../statements";

type CredentialOfferRequest = {
	scope: string;
};

export function credentialOfferFactory(config: Config) {
	return async function credentialOffer(expressRequest: Request) {
		try {
			const request = await validateRequest(expressRequest);

			const { client } = await issuerClient(config);

			const { scope: _scope } = await checkScope(
				request.scope,
				{ client },
				config,
			);

			const { grants } = await generateIssuerGrants(config);

			const {
				credentialOfferUrl,
				credentialOfferQrCode,
				supportedCredentialType,
			} = await credentialOfferHandler({ grants }, expressRequest, config);

			return {
				status: 200,
				body: {
					credentialOfferUrl,
					credentialOfferQrCode,
					supportedCredentialType,
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

	if (!scope) {
		throw new OauthError(
			400,
			"bad_request",
			"credential offer requests need a scope param",
		);
	}

	return { scope };
}
