import crypto from "node:crypto";
import Ajv from "ajv";
import type { Request } from "express";
import { SignJWT } from "jose";
import type { Config } from "../../config";
import type {
	CredentialConfiguration,
	CredentialConfigurationSupported,
	CredentialConfigurationsSupported,
	OpenidCredentialIssuer,
} from "../../resources";
import { openidCredentialIssuerHandlerConfigSchema } from "./schemas";

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

export type OpenidCredentialIssuerResponse = {
	status: 200;
	body: OpenidCredentialIssuer;
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

		const well_known: OpenidCredentialIssuer = {
			credential_issuer: config.issuer_url,
			display: config.issuer_display,
			nonce_endpoint,
			credential_endpoint,
			credential_configurations_supported,
		};

		well_known.signed_metadata = await generateSignedMetadata(well_known);

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

const metadataPrivateKey = `
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgtfEWwPl5+13fqLPw
j/22afeqn/BgARhgjbtoRKcUFLyhRANCAARVYrxredzOKhD9OkE9tAUpRojCHcyy
7xvm/X6v3xyjPjRk/mt7J14j8FO1+46zhVscMo2Xnmp+NPr8ehstOlX6
-----END PRIVATE KEY-----
`;

const metadataCertificate = `
-----BEGIN CERTIFICATE-----
MIICyzCCAnGgAwIBAgIULnrxux9sI34oqbby3M4lSKOs8owwCgYIKoZIzj0EAwIw
PzELMAkGA1UEBhMCRVUxFTATBgNVBAoMDHd3V2FsbGV0Lm9yZzEZMBcGA1UEAwwQ
d3dXYWxsZXQgUm9vdCBDQTAeFw0yNTA0MjkxMDI5NTNaFw0yNjA0MjkxMDI5NTNa
MEExCzAJBgNVBAYTAkVVMRUwEwYDVQQKDAx3d1dhbGxldC5vcmcxGzAZBgNVBAMM
EmxvY2FsLnd3d2FsbGV0Lm9yZzBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABFVi
vGt53M4qEP06QT20BSlGiMIdzLLvG+b9fq/fHKM+NGT+a3snXiPwU7X7jrOFWxwy
jZeean40+vx6Gy06VfqjggFHMIIBQzAdBgNVHQ4EFgQUM/A3FTQLjww5/9u01MX/
SRyVqaUwHwYDVR0jBBgwFoAU0HGu3T+/Wqh3yNifz9sNd+HPBS4wDgYDVR0PAQH/
BAQDAgeAMDIGA1UdEgQrMCmBEWluZm9Ad3d3YWxsZXQub3JnhhRodHRwczovL3d3
d2FsbGV0Lm9yZzASBgNVHSUECzAJBgcogYxdBQECMAwGA1UdEwEB/wQCMAAwRAYD
VR0fBD0wOzA5oDegNYYzaHR0cHM6Ly93d3dhbGxldC5vcmcvaWFjYS9jcmwvd3d3
YWxsZXRfb3JnX2lhY2EuY3JsMFUGA1UdEQROMEyCEmxvY2FsLnd3d2FsbGV0Lm9y
Z4IZbG9jYWwtaXNzdWVyLnd3d2FsbGV0Lm9yZ4IbbG9jYWwtdmVyaWZpZXIud3d3
YWxsZXQub3JnMAoGCCqGSM49BAMCA0gAMEUCIQCQ8h+5krhO+f4woReDY1D7CaM6
qCda3m814e6DLvOphAIgHQL+Wm7WFRwxgjzMLN37RojJGrZbF4OFChIkmm0uu5o=
-----END CERTIFICATE-----`;

async function generateSignedMetadata(metadata: OpenidCredentialIssuer) {
	const privateKey = crypto.createPrivateKey(metadataPrivateKey);
	const certificate = new crypto.X509Certificate(metadataCertificate);
	const x5c = [certificate.raw.toString("base64")];

	const now = Date.now() / 1000;

	const signed_metadata = await new SignJWT(metadata)
		.setProtectedHeader({ alg: "ES256", x5c })
		.setIssuedAt()
		.setExpirationTime(now + 3600)
		.sign(privateKey);

	return signed_metadata;
}
