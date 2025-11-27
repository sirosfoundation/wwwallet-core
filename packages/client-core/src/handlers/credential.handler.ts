import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError } from "../errors";
import type {
	ClientState,
	DeferredCredential,
	IssuerMetadata,
	Proofs,
} from "../resources";
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

export type CredentialResponse = {
	protocol: CredentialProtocol;
	nextStep?: CredentialNextStep;
	data?: {
		issuer_metadata: IssuerMetadata;
		client_state: ClientState;
		credentials?: Array<{ credential: string; format?: string }>;
		deferred_credential?: DeferredCredential;
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
			const { client_state } = await clientState({ state }, config);

			const { issuer_metadata } = await fetchIssuerMetadata(
				{
					client_state,
					issuer: client_state.issuer,
				},
				config,
			);

			const { dpop: credentialsDpop } = await generateDpop(
				{
					client_state,
					access_token,
					htu: issuer_metadata.credential_endpoint,
					htm: "POST",
				},
				config,
			);

			const { credentials, transaction_id, interval } = await fetchCredentials(
				{
					issuer_metadata,
					access_token,
					dpop: credentialsDpop,
					credential_configuration_id,
					proofs,
				},
				config,
			);

			const data: CredentialResponse["data"] = {
				issuer_metadata,
				client_state,
				credentials,
			};

			if (credentials) {
				data.credentials = credentials;
			}

			if (transaction_id && interval) {
				data.deferred_credential = {
					client_state,
					transaction_id,
					interval,
				};
			}

			return {
				protocol,
				nextStep,
				data,
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

function credentialErrorData({
	protocol,
	currentStep,
	nextStep,
	state,
	access_token,
	credential_configuration_id,
	proofs,
}: {
	protocol: string;
	currentStep: string;
	nextStep: string;
} & CredentialHandlerParams) {
	return {
		protocol,
		currentStep,
		nextStep,
		state,
		access_token,
		credential_configuration_id,
		proofs,
	};
}
