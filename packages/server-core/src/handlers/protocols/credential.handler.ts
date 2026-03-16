import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import type { BearerCredentials } from "../../resources";
import {
	type GenerateCredentialsConfig,
	generateCredentials,
	type ValidateAccessTokenConfig,
	type ValidateCredentialConfigurationIdsConfig,
	type ValidateCredentialConfigurationsConfig,
	type ValidateDpopConfig,
	type ValidateProofsConfig,
	validateAccessToken,
	validateCredentialConfigurationIds,
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
	ValidateCredentialConfigurationIdsConfig &
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
		credentials?: Array<{ credential: string }>;
		transaction_id?: string;
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
					token_type: request.credentials.token_type,
					access_token: request.credentials.access_token,
				},
				config,
			);

			await validateDpop(
				{
					token_type: request.credentials.token_type,
					access_token,
					dpopRequest: request.credentials.dpopRequest,
					dpop: request.credentials.dpop,
				},
				config,
			);

			const { credential_configurations } =
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

			const { credentials, transaction_id } = await generateCredentials(
				{
					sub,
					credential_configurations,
					jwks,
				},
				config,
			);

			config.logger.business("credential", {
				access_token,
				sub,
				scope,
				credential_configuration_ids: credential_configurations
					.map(({ credential_configuration_id }) => credential_configuration_id)
					.join(","),
			});

			return {
				status: 200,
				body: {
					credentials,
					transaction_id,
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
	if (
		!expressRequest.body ||
		typeof expressRequest.body !== "object" ||
		Array.isArray(expressRequest.body)
	) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential requests require a body",
		);
	}

	const { credential_configuration_id, proof } = expressRequest.body;
	if (
		credential_configuration_id !== undefined &&
		(typeof credential_configuration_id !== "string" ||
			credential_configuration_id.trim().length === 0)
	) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential configuration ids are invalid",
		);
	}
	const credential_configuration_ids_input =
		expressRequest.body.credential_configuration_ids;
	if (
		credential_configuration_ids_input !== undefined &&
		(!Array.isArray(credential_configuration_ids_input) ||
			credential_configuration_ids_input.some(
				(configuration_id) =>
					typeof configuration_id !== "string" ||
					configuration_id.trim().length === 0,
			))
	) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential configuration ids are invalid",
		);
	}

	const { credential_configuration_ids } =
		await validateCredentialConfigurationIds({
			credential_configuration_id,
			credential_configuration_ids: credential_configuration_ids_input,
		});

	if (
		proof !== undefined &&
		(typeof proof !== "object" || proof === null || Array.isArray(proof))
	) {
		throw new OauthError(400, "invalid_request", "proofs is invalid");
	}
	if (proof?.jwt !== undefined && typeof proof.jwt !== "string") {
		throw new OauthError(400, "invalid_request", "proofs is invalid");
	}
	if (
		proof?.attestation !== undefined &&
		typeof proof.attestation !== "string"
	) {
		throw new OauthError(400, "invalid_request", "proofs is invalid");
	}

	let proofs = expressRequest.body.proofs || (proof && {});

	if (typeof proofs === "string") {
		try {
			proofs = JSON.parse(proofs);
		} catch (_error) {
			throw new OauthError(400, "invalid_request", "proofs is invalid");
		}
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
	if (typeof proofs !== "object" || Array.isArray(proofs)) {
		throw new OauthError(400, "invalid_request", "proofs is invalid");
	}

	const credentials: CredentialRequest["credentials"] = {};

	let authorizationHeaderCount = 0;
	for (let i = 0; i < expressRequest.rawHeaders.length; i += 2) {
		if (expressRequest.rawHeaders[i].toLowerCase() === "authorization") {
			authorizationHeaderCount++;
		}
	}
	if (authorizationHeaderCount > 1) {
		throw new OauthError(
			400,
			"invalid_request",
			"authorization header is invalid",
		);
	}
	if (expressRequest.headers.authorization?.includes(",")) {
		throw new OauthError(
			400,
			"invalid_request",
			"authorization header is invalid",
		);
	}

	const authorizationHeaderCapture = /(\S+) (.+)/.exec(
		expressRequest.headers.authorization || "",
	);

	if (authorizationHeaderCapture) {
		credentials.token_type = authorizationHeaderCapture[1];
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
