import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError } from "../errors";
import type { DeferredCredential } from "../resources";
import {
	type FetchCredentialsConfig,
	type FetchIssuerMetadataConfig,
	fetchCredentials,
	fetchIssuerMetadata,
} from "../statements";
import { deferredCredentialHandlerConfigSchema } from "./schemas/deferredCredentialHandlerConfig.schema";

const ajv = new Ajv();

export type DeferredCredentialHandlerParams = {
	access_token: string;
	deferred_credential: DeferredCredential;
};

export type DeferredCredentialHandlerConfig = FetchCredentialsConfig &
	FetchIssuerMetadataConfig;

type DeferredCredentialHandlerProtocol = "oid4vci";

type DeferredCredentialHandlerNextStep = "deferred_credentials_success";

type DeferredCredentialResponse = {
	protocol: DeferredCredentialHandlerProtocol;
	nextStep: DeferredCredentialHandlerNextStep;
	data: {
		deferred_credential: DeferredCredential;
		credentials: Array<{ credential: string }> | undefined;
	};
};

const protocol = "oid4vci";
const currentStep = "deferred_credentials";
const nextStep = "deferred_credentials_success";

export function deferredCredentialHandlerFactory(
	config: DeferredCredentialHandlerConfig,
) {
	return async function deferredCredentialHandler({
		access_token,
		deferred_credential,
	}: DeferredCredentialHandlerParams): Promise<DeferredCredentialResponse> {
		try {
			const { client_state } = deferred_credential;

			const { issuer_metadata } = await fetchIssuerMetadata(
				{
					issuer: client_state.issuer,
					client_state,
				},
				config,
			);

			const { credentials } = await fetchCredentials(
				{
					client_state,
					issuer_metadata,
					access_token,
					deferred_credential,
				},
				config,
			);

			return {
				protocol,
				nextStep,
				data: {
					deferred_credential,
					credentials,
				},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				const data = deferredCredentialErrorData({
					protocol,
					currentStep,
					nextStep,
					deferred_credential,
				});
				throw error.toResponse(data);
			}

			throw error;
		}
	};
}

export function validateDeferredCredentialHandlerConfig(config: Config) {
	const validate = ajv.compile(deferredCredentialHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}

function deferredCredentialErrorData({
	protocol,
	currentStep,
	nextStep,
	deferred_credential,
}: {
	protocol: string;
	currentStep: string;
	nextStep: string;
	deferred_credential: DeferredCredential;
}) {
	return {
		protocol,
		currentStep,
		nextStep,
		deferred_credential,
	};
}
