import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError } from "../errors";
import {
	type FetchAuthorizationUrlConfig,
	fetchAuthorizationUrl,
	type IssuerClientConfig,
	issuerClient,
} from "../statements";
import { pushedAuthorizationRequestHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type PushedAuthorizationRequestHandlerConfig =
	FetchAuthorizationUrlConfig & IssuerClientConfig;

type PushedAuthorizationRequestHandlerParams = {
	issuer: string;
	issuer_state: string;
};

type PushedAuthorizationRequestProtocol = "oid4vci";

type PushedAuthorizationRequestNextStep = "authorize";

type PushedAuthorizationRequestResponse = {
	protocol: PushedAuthorizationRequestProtocol;
	nextStep: PushedAuthorizationRequestNextStep;
	data: {
		authorize_url: string;
	};
};

const protocol = "oid4vci";
const nextStep = "authorize";

export function pushedAuthorizationRequestHandlerFactory(
	config: PushedAuthorizationRequestHandlerConfig,
) {
	return async function pushedAuthorizationRequestHandler({
		issuer,
		issuer_state,
	}: PushedAuthorizationRequestHandlerParams): Promise<PushedAuthorizationRequestResponse> {
		try {
			const { client } = await issuerClient({ issuer }, config);

			const { authorize_url } = await fetchAuthorizationUrl(
				{
					issuer,
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
		} catch (error) {
			if (error instanceof OauthError) {
				const data = templateErrorData({ issuer, issuer_state });
				throw error.toResponse(data);
			}

			throw error;
		}
	};
}

export function validatePushedAuthorizationRequestHandlerConfig(
	config: Config,
) {
	const validate = ajv.compile(pushedAuthorizationRequestHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}

function templateErrorData(params: PushedAuthorizationRequestHandlerParams) {
	return params;
}
