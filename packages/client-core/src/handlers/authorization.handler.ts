import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError } from "../errors";
import type { IssuerMetadata } from "../resources";
import {
	clientState,
	type FetchAuthorizationUrlConfig,
	type FetchIssuerMetadataConfig,
	fetchAuthorizationUrl,
	fetchIssuerMetadata,
	type IssuerClientConfig,
	issuerClient,
} from "../statements";
import { authorizationHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type AuthorizationHandlerConfig = FetchIssuerMetadataConfig &
	FetchAuthorizationUrlConfig &
	IssuerClientConfig;

type AuthorizationHandlerParams = {
	issuer: string;
	issuer_state: string;
};

type AuthorizationProtocol = "oid4vci";

type PushedAuthorizationRequestResponse = {
	protocol: AuthorizationProtocol;
	nextStep: "authorize";
	data: {
		authorize_url: string;
	};
};

type AuthorizationChallengeResponse = {
	protocol: AuthorizationProtocol;
	nextStep: "authorization_challenge";
	data: {
		issuer_metadata: IssuerMetadata;
	};
};

type AuthorizationResponse =
	| PushedAuthorizationRequestResponse
	| AuthorizationChallengeResponse;

const protocol = "oid4vci";

export function authorizationHandlerFactory(
	config: AuthorizationHandlerConfig,
) {
	return async function authorizationHandler({
		issuer,
		issuer_state,
	}: AuthorizationHandlerParams): Promise<AuthorizationResponse> {
		try {
			const { client } = await issuerClient({ issuer }, config);

			const { client_state: initialClientState } = await clientState(
				{ issuer, issuer_state },
				config,
			);

			const { issuer_metadata, client_state: issuerMetadataClientState } =
				await fetchIssuerMetadata(
					{
						issuer,
						client_state: initialClientState,
					},
					config,
				);

			if (issuer_metadata.pushed_authorization_request_endpoint) {
				const nextStep = "authorize";
				const { authorize_url } = await fetchAuthorizationUrl(
					{
						client_state: issuerMetadataClientState,
						client,
						issuer_state,
					},
					config,
				);

				return {
					protocol,
					nextStep,
					data: {
						authorize_url,
					},
				};
			}

			if (issuer_metadata.authorization_challenge_endpoint) {
				const nextStep = "authorization_challenge";
				return {
					protocol,
					nextStep,
					data: {
						issuer_metadata,
					},
				};
			}

			throw new OauthError(
				400,
				"invalid_request",
				"authorization method not supported",
			);
		} catch (error) {
			if (error instanceof OauthError) {
				const data = templateErrorData({ issuer, issuer_state });
				throw error.toResponse(data);
			}

			throw error;
		}
	};
}

export function validateAuthorizationHandlerConfig(config: Config) {
	const validate = ajv.compile(authorizationHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}

function templateErrorData(params: AuthorizationHandlerParams) {
	return params;
}
