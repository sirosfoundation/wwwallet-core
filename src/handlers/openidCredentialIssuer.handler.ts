import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../config";
import type { CredentialConfiguration } from "../resources";
import { openidCredentialIssuerHandlerConfigSchema } from "./schemas/openidCredentialIssuerHandlerConfig.schema";

const ajv = new Ajv();

export type OpenidCredentialIssuerHandlerConfig = {
	issuer_url: string;
	issuer_display: Array<{
		locale: string;
		logo?: {
			uri: string;
		};
		name?: string;
	}>;
	supported_credential_configurations: Array<{
		credential_configuration_id: string;
		label?: string;
		scope: string;
		format: string;
		vct?: string;
		display: Array<{
			name: string;
			description?: string;
			background_image?: {
				uri: string;
			};
			background_color?: string;
			text_color?: string;
			locale: string;
		}>;
	}>;
};

type CredentialConfigurationSupported = {
	format: string;
	vct?: string;
	doctype?: string;
	scope: string;
	description?: string;
	display: Array<{
		name: string;
		description?: string;
		background_image?: {
			uri: string;
		};
		background_color?: string;
		text_color?: string;
		locale: string;
	}>;
	cryptographic_binding_methods_supported: Array<string>;
	credential_signing_alg_values_supported: Array<string>;
	proof_types_supported: {
		jwt: {
			proof_signing_alg_values_supported: Array<string>;
		};
		attestation: {
			proof_signing_alg_values_supported: Array<string>;
			key_attestations_required: {};
		};
	};
};

type CredentialConfigurationsSupported = {
	[credential_configuration_id: string]: CredentialConfigurationSupported;
};

type OpenidCredentialIssuerResponse = {
	status: 200;
	body: {
		credential_issuer: string;
		nonce_endpoint: string;
		credential_endpoint: string;
		display: Array<{
			locale: string;
			logo?: {
				uri: string;
			};
			name?: string;
		}>;
		credential_configurations_supported: CredentialConfigurationsSupported;
	};
};

export function openidCredentialIssuerHandlerFactory(
	config: OpenidCredentialIssuerHandlerConfig,
) {
	return async function openidCredentialIssuerHandler(
		_expressRequest: Request,
	): Promise<OpenidCredentialIssuerResponse> {
		const nonce_endpoint = new URL("/nonce", config.issuer_url).toString();
		const credential_endpoint = new URL(
			"/credential",
			config.issuer_url,
		).toString();

		const credential_configurations_supported: CredentialConfigurationsSupported =
			{};

		config.supported_credential_configurations.forEach(
			(configuration: CredentialConfiguration) => {
				const credential_configuration: CredentialConfigurationSupported = {
					format: configuration.format,
					scope: configuration.scope,
					display: configuration.display,
					cryptographic_binding_methods_supported: ["jwk"],
					credential_signing_alg_values_supported: ["ES256"],
					proof_types_supported: {
						jwt: {
							proof_signing_alg_values_supported: ["ES256"],
						},
						attestation: {
							proof_signing_alg_values_supported: ["ES256"],
							key_attestations_required: {},
						},
					},
				};

				if (configuration.format.match("sd-jwt")) {
					credential_configuration.vct = configuration.vct;
				}

				if (configuration.format.match("mso_mdoc")) {
					credential_configuration.doctype = configuration.doctype;
				}

				credential_configurations_supported[
					configuration.credential_configuration_id
				] = credential_configuration;
			},
		);

		const well_known = {
			credential_issuer: config.issuer_url,
			display: config.issuer_display,
			nonce_endpoint,
			credential_endpoint,
			credential_configurations_supported,
		};

		return {
			status: 200,
			body: well_known,
		};
	};
}

export function validateOpenidCredentialIssuerHandlerConfig(config: Config) {
	const validate = ajv.compile(openidCredentialIssuerHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate openidCredentialIssuer handler configuration - ${errorText}`,
		);
	}
}
