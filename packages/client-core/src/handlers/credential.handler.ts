import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError } from "../errors";
import type { Proofs } from "../resources";
import {
	type ClientStateConfig,
	clientState,
	type FetchCredentialsConfig,
	type FetchIssuerMetadataConfig,
	fetchCredentials,
	fetchIssuerMetadata,
	type GenerateDpopConfig,
	generateDpop,
} from "../statements";
import { credentialHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type CredentialHandlerParams = {
	state: string;
	access_token: string;
	credential_configuration_id: string;
	proofs?: Proofs;
};

export type CredentialHandlerConfig = ClientStateConfig &
	FetchIssuerMetadataConfig &
	GenerateDpopConfig &
	FetchCredentialsConfig;

type CredentialProtocol = "oid4vci";

type CredentialNextStep = "credential_success";

type CredentialResponse = {
	protocol: CredentialProtocol;
	nextStep?: CredentialNextStep;
	data?: {
		credentials: Array<string>;
	};
};

const protocol = "oid4vci";
const currentStep = "credential_request";
const nextStep = "credential_success";

export function credentialHandlerFactory(config: CredentialHandlerConfig) {
	return async function credentialHandler({
		state,
		access_token,
		credential_configuration_id,
		proofs,
	}: CredentialHandlerParams): Promise<CredentialResponse> {
		try {
			const { client_state: initialClientState } = await clientState(
				{ state },
				config,
			);

			const { issuer_metadata } = await fetchIssuerMetadata(
				{
					client_state: initialClientState,
				},
				config,
			);

			const { dpop: credentialsDpop } = await generateDpop(
				{
					access_token,
					htm: issuer_metadata.credential_endpoint,
					htu: "POST",
				},
				config,
			);

			const { credentials } = await fetchCredentials(
				{
					issuer_metadata,
					access_token,
					dpop: credentialsDpop,
					credential_configuration_id,
					proofs,
				},
				config,
			);

			return {
				protocol,
				nextStep,
				data: {
					credentials,
				},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				const data = credentialErrorData({
					protocol,
					currentStep,
					nextStep,
					state,
					access_token,
					credential_configuration_id,
					proofs,
				});
				throw error.toResponse(data);
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
			`Could not validate credential handler configuration - ${errorText}`,
		);
	}
}

function credentialErrorData(
	params: {
		protocol: string;
		currentStep: string;
		nextStep: string;
	} & CredentialHandlerParams,
) {
	return params;
}
