import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../config";
import { OauthError, type OauthErrorResponse } from "../errors";
import type { CredentialConfiguration, OauthClient } from "../resources";
import {
	generateCredentials,
	validateAccessToken,
	validateCredentialConfigurations,
	validateDpop,
	validateProofs,
} from "../statements";
import { credentialHandlerConfigSchema } from "./schemas/credentialHandlerConfig.schema";

const ajv = new Ajv();

export type CredentialHandlerConfig = {
	issuer_url: string;
	databaseOperations: {
		resourceOwnerData: (sub: string, vct?: string) => Promise<unknown>;
	};
	clients: Array<OauthClient>;
	issuer_client: OauthClient;
	secret: string;
	previous_secrets: Array<string>;
	supported_credential_configurations: Array<CredentialConfiguration>;
	trusted_root_certificates: Array<string>;
};

type CredentialRequest = {
	credential_configuration_ids: Array<string>;
	credentials: {
		access_token?: string;
		dpop?: string | string[];
	};
	proofs: {
		jwt?: Array<string>;
		attestation?: Array<string>;
	};
	dpopRequest: {
		method: string;
		uri: string;
	};
};

type CredentialResponse = {
	status: 200;
	body: {
		credentials: Array<{ credential: string }>;
	};
};

export function credentialHandlerFactory(config: CredentialHandlerConfig) {
	return async function credentialHandler(
		expressRequest: Request,
	): Promise<CredentialResponse | OauthErrorResponse> {
		try {
			const request = await validateRequest(expressRequest);

			const { sub, client, scope, access_token } = await validateAccessToken(
				{
					access_token: request.credentials.access_token,
				},
				config,
			);

			await validateDpop(
				{
					access_token,
					dpopRequest: request.dpopRequest,
					dpop: request.credentials.dpop,
				},
				config,
			);

			const { credential_configuration_ids } =
				await validateCredentialConfigurations(
					request.credential_configuration_ids,
					{ client, scope },
					config,
				);

			const { proofs: _proofs } = await validateProofs(
				{
					proofs: request.proofs,
				},
				config,
			);

			const { credentials } = await generateCredentials(
				{
					sub,
					credential_configuration_ids,
				},
				config,
			);

			return {
				status: 200,
				body: {
					credentials,
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

export function validateCredentialHandlerConfig(config: Config) {
	const validate = ajv.compile(credentialHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}

async function validateRequest(
	expressRequest: Request,
): Promise<CredentialRequest> {
	if (!expressRequest.body) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential requests require a body",
		);
	}

	const { credential_configuration_id, proof } = expressRequest.body;

	const credential_configuration_ids =
		expressRequest.body.credential_configuration_ids ||
		(credential_configuration_id && [credential_configuration_id]);

	if (!credential_configuration_ids?.length) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential configuration ids are missing from body parameters",
		);
	}

	const proofs = expressRequest.body.proofs || (proof && {});

	if (proof?.jwt) {
		proofs.jwt = [proof.jwt];
	}
	if (proof?.attestation) {
		proofs.attestation = [proof.attestation];
	}

	if (!proofs) {
		throw new OauthError(
			400,
			"invalid_request",
			"proofs is missing from body parameters",
		);
	}

	const credentials: CredentialRequest["credentials"] = {};

	const authorizationHeaderCapture = /(DPoP|[b|B]earer) (.+)/.exec(
		expressRequest.headers.authorization || "",
	);

	if (authorizationHeaderCapture) {
		credentials.access_token = authorizationHeaderCapture[2];
	}

	credentials.dpop = expressRequest.headers.dpop;

	const dpopRequest = {
		method: expressRequest.method,
		uri: expressRequest.originalUrl,
	};

	return {
		credential_configuration_ids,
		proofs,
		dpopRequest,
		credentials,
	};
}
