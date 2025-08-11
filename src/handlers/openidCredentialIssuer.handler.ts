import Ajv from "ajv";
import type { Request } from "express";
import { Config } from "../config";
import { openidCredentialIssuerHandlerConfigSchema } from "./schemas/openidCredentialIssuerHandlerConfig.schema";

const ajv = new Ajv()

export type OpenidCredentialIssuerHandlerConfig = {
  issuer_url: string;
};

type OpenidCredentialIssuerResponse = {
	status: 200;
	body: {
		credential_issuer: string,
		nonce_endpoint: string,
		credential_endpoint: string,
	};
};

export function openidCredentialIssuerHandlerFactory(config: OpenidCredentialIssuerHandlerConfig) {
	return async function openidCredentialIssuerHandler(
		expressRequest: Request,
	): Promise<OpenidCredentialIssuerResponse> {
    const nonce_endpoint = new URL('/nonce', config.issuer_url).toString();
    const credential_endpoint = new URL('/credential', config.issuer_url).toString();

    const well_known = {
      credential_issuer: config.issuer_url,
      nonce_endpoint,
      credential_endpoint,
    };

    return {
      status: 200,
      body: well_known
    }
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
