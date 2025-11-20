import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import type { BearerCredentials } from "../../resources";
import {
	type GenerateCredentialsConfig,
	generateCredentials,
	type ValidateAccessTokenConfig,
	type ValidateCredentialConfigurationsConfig,
	type ValidateDpopConfig,
	type ValidateProofsConfig,
	validateAccessToken,
	validateCredentialConfigurations,
	validateDpop,
	validateProofs,
} from "../../statements";
import { credentialHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type CredentialHandlerConfig = {
	logger: Logger;
} & ValidateAccessTokenConfig &
	ValidateDpopConfig &
	ValidateCredentialConfigurationsConfig &
	ValidateProofsConfig &
	GenerateCredentialsConfig;

type CredentialRequest = {
	credential_configuration_ids: Array<string>;
	credentials: BearerCredentials;
	proofs: {
		jwt?: Array<string>;
		attestation?: Array<string>;
	};
};

export type CredentialResponse = {
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
					dpopRequest: request.credentials.dpopRequest,
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

			const { proofs: _proofs, jwks } = await validateProofs(
				{
					proofs: request.proofs,
				},
				config,
			);

			const { credentials } = await generateCredentials(
				{
					sub,
					credential_configuration_ids,
					jwks,
				},
				config,
			);

			config.logger.business("credential", {
				access_token,
				sub,
				scope,
				credential_configuration_ids: credential_configuration_ids.join(","),
			});

			return {
				status: 200,
				body: {
					credentials,
				},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				config.logger.business("credential_error", { error: error.message });
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

	let proofs = expressRequest.body.proofs || (proof && {});

	if (typeof proofs === "string") {
		proofs = JSON.parse(proofs);
	}

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

	credentials.dpopRequest = {
		method: expressRequest.method,
		uri: expressRequest.originalUrl,
	};

	return {
		credential_configuration_ids,
		proofs,
		credentials,
	};
}
