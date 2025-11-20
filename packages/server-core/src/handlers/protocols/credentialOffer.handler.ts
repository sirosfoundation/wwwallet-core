import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import type { CredentialConfiguration } from "../../resources";
import {
	generateCredentialOffer,
	generateIssuerGrants,
	issuerClient,
	validateScope,
} from "../../statements";
import { credentialOfferHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type CredentialOfferHandlerConfig = {
	logger: Logger;
	issuer_url: string;
	wallet_url: string;
	issuer_client: {
		id: string;
		scopes: Array<string>;
	};
	secret: string;
	token_encryption: string;
	issuer_state_ttl: number;
	supported_credential_configurations: Array<CredentialConfiguration>;
};

type CredentialOfferRequest = {
	scope: string;
};

export type CredentialOfferResponse = {
	status: 200;
	data: {
		credentialOfferUrl: string;
		credentialOfferQrCode: string;
		credentialConfigurations: Array<CredentialConfiguration>;
	};
	body: {
		credential_offer_url: string;
		credential_offer_qrcode: string;
	};
};

export function credentialOfferHandlerFactory(
	config: CredentialOfferHandlerConfig,
) {
	return async function credentialOfferHandler(
		expressRequest: Request,
	): Promise<CredentialOfferResponse | OauthErrorResponse> {
		try {
			const request = await validateRequest(expressRequest);

			const { client } = await issuerClient(config);

			const { scope } = await validateScope(request.scope, { client }, config);

			const { grants } = await generateIssuerGrants({ client }, config);

			const {
				credentialOfferUrl,
				credentialOfferQrCode,
				credentialConfigurations,
			} = await generateCredentialOffer(
				{
					grants,
					scope,
				},
				config,
			);

			config.logger.business("credential_offer", {
				client_id: client.id,
				scope,
				credential_configuration_ids: credentialConfigurations
					.map(({ credential_configuration_id }) => credential_configuration_id)
					.join(","),
			});
			return {
				status: 200,
				data: {
					credentialOfferUrl,
					credentialOfferQrCode,
					credentialConfigurations,
				},
				body: {
					credential_offer_url: credentialOfferUrl,
					credential_offer_qrcode: credentialOfferQrCode,
				},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				config.logger.business("credential_offer_error", {
					error: error.message,
				});
				return error.toResponse();
			}

			throw error;
		}
	};
}

export function validateCredentialOfferHandlerConfig(config: Config) {
	const validate = ajv.compile(credentialOfferHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate credentialOffer handler configuration - ${errorText}`,
		);
	}
}

async function validateRequest(
	expressRequest: Request,
): Promise<CredentialOfferRequest> {
	if (!expressRequest.params) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential offer requests need path params",
		);
	}

	const { scope } = expressRequest.params;

	if (!scope) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential offer requests need a scope param",
		);
	}

	return { scope };
}
