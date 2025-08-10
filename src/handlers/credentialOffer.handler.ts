import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import type {
	AuthorizationServerState,
	CredentialConfiguration,
} from "../resources";
import {
	checkScope,
	generateCredentialOffer,
	generateIssuerGrants,
	issuerClient,
} from "../statements";
import { credentialOfferHandlerConfigSchema } from "./schemas/credentialOfferHandlerConfig.schema";

const ajv = new Ajv();

export type CredentialOfferHandlerConfig = {
	databaseOperations: {
		insertAuthorizationServerState: (
			authorizationServerState: AuthorizationServerState,
		) => Promise<AuthorizationServerState>;
	};
	tokenGenerators: {
		generateIssuerState: () => string;
	};
	issuer_url: string;
	wallet_url: string;
	issuer_client: {
		scopes: Array<string>;
	};
	supported_credential_configurations: Array<{
		credential_configuration_id: string;
		label?: string;
		scope: string;
		format: string;
		vct?: string;
	}>;
};

type CredentialOfferRequest = {
	scope: string;
	authorizationServerState: AuthorizationServerState;
};

type CredentialOfferResponse = {
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

			const { scope } = await checkScope(request.scope, { client }, config);

			const { grants } = await generateIssuerGrants(config);

			const {
				credentialOfferUrl,
				credentialOfferQrCode,
				credentialConfigurations,
			} = await generateCredentialOffer(
				{
					authorizationServerState: request.authorizationServerState,
					grants,
					scope,
				},
				config,
			);

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
	// @ts-ignore
	let authorizationServerState = expressRequest.authorizationServerState;

	if (!scope) {
		throw new OauthError(
			400,
			"invalid_request",
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
