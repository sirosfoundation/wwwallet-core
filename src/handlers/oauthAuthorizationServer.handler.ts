import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../config";
import { oauthAuthorizationServerHandlerConfigSchema } from "./schemas/oauthAuthorizationServerHandlerConfig.schema";

const ajv = new Ajv();

export type OauthAuthorizationServerHandlerConfig = {
	issuer_url: string;
	clients: Array<{ scopes: Array<string> }>;
	issuer_client: { scopes: Array<string> };
};

type OauthAuthorizationServerResponse = {
	status: 200;
	body: {
		issuer: string;
		authorization_endpoint: string;
		authorization_challenge_endpoint: string;
		token_endpoint: string;
		pushed_authorization_request_endpoint: string;
		require_pushed_authorization_requests: boolean;
		token_endpoint_auth_methods_supported: Array<string>;
		response_types_supported: Array<string>;
		code_challenge_methods_supported: Array<string>;
		dpop_signing_alg_values_supported: Array<string>;
		grant_types_supported: Array<string>;
		jwks_uri: string;
		scopes_supported: Array<string>;
	};
};

export function oauthAuthorizationServerHandlerFactory(
	config: OauthAuthorizationServerHandlerConfig,
) {
	return async function oauthAuthorizationServerHandler(
		_expressRequest: Request,
	): Promise<OauthAuthorizationServerResponse> {
		const authorization_endpoint = new URL(
			"/authorize",
			config.issuer_url,
		).toString();
		const authorization_challenge_endpoint = new URL(
			"/authorization-challenge",
			config.issuer_url,
		).toString();
		const token_endpoint = new URL("/token", config.issuer_url).toString();
		const pushed_authorization_request_endpoint = new URL(
			"/pushed-authorization-request",
			config.issuer_url,
		).toString();
		const jwks_uri = new URL("/jwks", config.issuer_url).toString();

		let scopes_supported = config.issuer_client.scopes.concat(
			config.clients.flatMap(({ scopes }) => scopes),
		);
		scopes_supported = scopes_supported
			.filter((e, index) => scopes_supported.indexOf(e) === index)
			.filter((e) => e);

		const well_known = {
			issuer: config.issuer_url,
			authorization_endpoint,
			authorization_challenge_endpoint,
			token_endpoint,
			pushed_authorization_request_endpoint,
			require_pushed_authorization_requests: true,
			jwks_uri,
			token_endpoint_auth_methods_supported: ["none"],
			response_types_supported: ["code"],
			code_challenge_methods_supported: ["S256"],
			dpop_signing_alg_values_supported: ["ES256"],
			grant_types_supported: ["authorization_code", "refresh_token"],
			scopes_supported,
		};

		return {
			status: 200,
			body: well_known,
		};
	};
}

export function validateOauthAuthorizationServerHandlerConfig(config: Config) {
	const validate = ajv.compile(oauthAuthorizationServerHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate oauthAuthorizationServer handler configuration - ${errorText}`,
		);
	}
}
