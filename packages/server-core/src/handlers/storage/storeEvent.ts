import Ajv from "ajv";
import type { Request } from "express";
import { decodeProtectedHeader } from "jose";
import type { Config } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import {
	type StoreEventConfig,
	storeEvent,
	type ValidateDpopConfig,
	type ValidateStorageTokenConfig,
	validateDpop,
	validateStorageToken,
} from "../../statements";
import { storeEventHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type StoreEventHandlerConfig = ValidateStorageTokenConfig &
	StoreEventConfig &
	ValidateDpopConfig;

type StoreEventRequest = {
	hash: string;
	payload: string;
	credentials: {
		access_token?: string;
		dpop?: string | Array<string>;
		dpopRequest: {
			method: string;
			uri: string;
		};
	};
};

type StoreEventResponse = {
	status: 200;
	data: {};
	body: {};
};

export function storeEventHandlerFactory(config: StoreEventHandlerConfig) {
	return async function storeEventHandler(
		expressRequest: Request,
	): Promise<StoreEventResponse | OauthErrorResponse> {
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

			const { event } = await storeEvent(
				{
					storage_token,
					hash: request.hash,
					payload: request.payload,
				},
				config,
			);

			return {
				status: 200,
				data: {},
				body: event,
			};
		} catch (error) {
			if (error instanceof OauthError) {
				const data = errorData(expressRequest);
				return error.toResponse(data);
			}

			throw error;
		}
	};
}

export function validateStoreEventHandlerConfig(config: Config) {
	const validate = ajv.compile(storeEventHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}

async function validateRequest(
	expressRequest: Request,
): Promise<StoreEventRequest> {
	const hash = expressRequest.params.hash;
	if (!hash) {
		throw new OauthError(
			400,
			"invalid_request",
			"hash path parameter is required",
		);
	}

	const dpopRequest = {
		method: expressRequest.method,
		uri: expressRequest.originalUrl,
	};

	const credentials: StoreEventRequest["credentials"] = {
		dpopRequest,
	};

	const authorizationHeaderCapture = /(DPoP|[b|B]earer) (.+)/.exec(
		expressRequest.headers.authorization || "",
	);

	if (authorizationHeaderCapture) {
		credentials.access_token = authorizationHeaderCapture[2];
	}

	credentials.dpop = expressRequest.headers.dpop;

	if (expressRequest.headers["content-type"] !== "application/jose") {
		throw new OauthError(
			400,
			"invalid_request",
			"application/jose body is required",
		);
	}

	const payload = expressRequest.body;

	try {
		const { alg, enc } = decodeProtectedHeader(payload);
		if (!alg || !enc) throw new Error("jwe header parameters are missing");
	} catch (error) {
		throw new OauthError(
			400,
			"invalid_request",
			(error as Error).message.toLowerCase(),
		);
	}

	return { hash, credentials, payload };
}

function errorData(expressRequest: Request) {
	return { hash: expressRequest.params.hash };
}
