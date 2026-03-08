import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../../config";
import type { OpenidConfiguration } from "../../resources";
import { openidConfigurationHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type OpenidConfigurationHandlerConfig = {
	issuer_url: string;
	clients: Array<{ scopes: Array<string> }>;
	issuer_client: { scopes: Array<string> };
};

export type OpenidConfigurationResponse = {
	status: 200;
	body: OpenidConfiguration;
};

export function openidConfigurationHandlerFactory(
	config: OpenidConfigurationHandlerConfig,
) {
	return async function openidConfigurationHandler(
		_expressRequest: Request,
	): Promise<OpenidConfigurationResponse> {
		const authorization_endpoint = new URL(
			"/authorize",
			config.issuer_url,
		).toString();
		const token_endpoint = new URL("/token", config.issuer_url).toString();
		const userinfo_endpoint = new URL(
			"/userinfo",
			config.issuer_url,
		).toString();
		const jwks_uri = new URL("/jwks", config.issuer_url).toString();

		let scopes_supported = config.issuer_client.scopes.concat(
			config.clients.flatMap(({ scopes }) => scopes),
		);
		scopes_supported = scopes_supported
			.filter((e, index) => scopes_supported.indexOf(e) === index)
			.filter((e) => e);

		const metadata: OpenidConfiguration = {
			issuer: config.issuer_url,
			authorization_endpoint,
			token_endpoint,
			userinfo_endpoint,
			jwks_uri,
			response_types_supported: ["code", "token", "code token"],
			subject_types_supported: ["public"],
			id_token_signing_alg_values_supported: ["HS256"],
			scopes_supported,
			claims_supported: ["sub"],
			grant_types_supported: [
				"authorization_code",
				"implicit",
				"refresh_token",
			],
		};

		return {
			status: 200,
			body: metadata,
		};
	};
}

export function validateOpenidConfigurationHandlerConfig(config: Config) {
	const validate = ajv.compile(openidConfigurationHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate openid configuration handler configuration - ${errorText}`,
		);
	}
}
