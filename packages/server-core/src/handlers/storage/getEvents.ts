import Ajv from "ajv";
import type { Request } from "express";
import type { Config } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import {
	type FetchEventsConfig,
	fetchEvents,
	type ValidateDpopConfig,
	type ValidateStorageTokenConfig,
	validateDpop,
	validateStorageToken,
} from "../../statements";
import { getEventsHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type GetEventsHandlerConfig = ValidateDpopConfig &
	ValidateStorageTokenConfig &
	FetchEventsConfig;

type GetEventsRequest = {
	credentials: {
		access_token?: string;
		dpop?: string | Array<string>;
		dpopRequest: {
			method: string;
			uri: string;
		};
	};
};

type GetEventsResponse = {
	status: 200;
	data: {};
	body: {
		events: Record<string, string>;
	};
};

export function getEventsHandlerFactory(config: GetEventsHandlerConfig) {
	return async function getEventsHandler(
		expressRequest: Request,
	): Promise<GetEventsResponse | OauthErrorResponse> {
		try {
			const request = await validateRequest(expressRequest);

			const { storage_token } = await validateStorageToken(
				{
					access_token: request.credentials.access_token,
				},
				config,
			);

			await validateDpop(
				{
					access_token: storage_token.access_token,
					dpopRequest: request.credentials.dpopRequest,
					dpop: request.credentials.dpop,
				},
				config,
			);

			const { events } = await fetchEvents(
				{
					storage_token,
				},
				config,
			);

			return {
				status: 200,
				data: {},
				body: {
					events,
				},
			};
		} catch (error) {
			if (error instanceof OauthError) {
				return error.toResponse();
			}

			throw error;
		}
	};
}

export function validateGetEventsHandlerConfig(config: Config) {
	const validate = ajv.compile(getEventsHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate get events handler configuration - ${errorText}`,
		);
	}
}

async function validateRequest(
	expressRequest: Request,
): Promise<GetEventsRequest> {
	const dpopRequest = {
		method: expressRequest.method,
		uri: expressRequest.originalUrl,
	};

	const credentials: GetEventsRequest["credentials"] = {
		dpopRequest,
	};

	const authorizationHeaderCapture = /(DPoP|[b|B]earer) (.+)/.exec(
		expressRequest.headers.authorization || "",
	);

	if (authorizationHeaderCapture) {
		credentials.access_token = authorizationHeaderCapture[2];
	}

	credentials.dpop = expressRequest.headers.dpop;

	return { credentials };
}
