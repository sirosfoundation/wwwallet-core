import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError } from "../errors";
import {
	type ClientStateConfig,
	clientState,
	type FetchIssuerMetadataConfig,
	fetchIssuerMetadata,
	type GenerateDpopConfig,
	generateDpop,
} from "../statements";
import { credentialHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type CredentialHandlerParams = {
	state: string;
	access_token: string;
	// credential_configuration_id: string;
	// proofs?: {
	// 	jwt?: Array<string>;
	// 	attestation?: Array<string>;
	// };
};

export type CredentialHandlerConfig = ClientStateConfig &
	FetchIssuerMetadataConfig &
	GenerateDpopConfig;

type CredentialProtocol = "oid4vci";

type CredentialNextStep = "credential_success";

type CredentialResponse = {
	protocol: CredentialProtocol;
	nextStep?: CredentialNextStep;
	data?: {
		dpop: string;
	};
};

const protocol = "oid4vci";
const nextStep = "credential_success";

export function credentialHandlerFactory(config: CredentialHandlerConfig) {
	return async function credentialHandler({
		state,
		access_token,
		// credential_configuration_id,
		// proofs,
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

			return {
				protocol,
				nextStep,
				data: {
					dpop: credentialsDpop,
				},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				const data = templateErrorData({ protocol, nextStep });
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
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}

function templateErrorData(params: { protocol: string; nextStep: string }) {
	return params;
}
