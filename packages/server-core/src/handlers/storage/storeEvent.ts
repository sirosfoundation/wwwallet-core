import Ajv from "ajv";
import type { Request } from "express";
import { decodeJwt, decodeProtectedHeader } from "jose";
import type { Config } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import type {
	EventAddressingRecord,
	EventAddressingTable,
	WalletEvent,
} from "../../resources";
import {
	type StoreEventConfig,
	storeEvent,
	type ValidateDpopConfig,
	type ValidateStorageTokenConfig,
	validateDpop,
	validateStorageToken,
} from "../../statements";
import { validateWalletEvents } from "../../statements/validations/validateWalletEvents";
import { storeEventHandlerConfigSchema } from "./schemas";

const ajv = new Ajv();

export type StoreEventHandlerConfig = ValidateStorageTokenConfig &
	StoreEventConfig &
	ValidateDpopConfig;

type StoreEventRequest = {
	credentials: {
		access_token?: string;
		dpop?: string | Array<string>;
		dpopRequest: {
			method: string;
			uri: string;
		};
	};
	addressing_table: EventAddressingTable;
	events: Array<WalletEvent>;
};

type StoreEventResponse = {
	status: 200;
	data: {};
	body: {
		events: Array<WalletEvent>;
	};
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

			const { events, addressing_table } = await validateWalletEvents(
				{
					addressing_table: request.addressing_table,
					events: request.events,
				},
				config,
			);

			const { events: storedEvents } = await storeEvent(
				{
					storage_token,
					events,
					addressing_table,
				},
				config,
			);

			return {
				status: 200,
				data: {},
				body: {
					events: storedEvents,
				},
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

	if (!expressRequest.body) {
		throw new OauthError(
			400,
			"invalid_request",
			"store event requests require a body",
		);
	}

	const raw_addressing_table = expressRequest.body.addressing_table;

	if (!raw_addressing_table) {
		throw new OauthError(
			400,
			"invalid_request",
			"addressing table parameter is required",
		);
	}

	if (!Array.isArray(raw_addressing_table)) {
		throw new OauthError(
			400,
			"invalid_request",
			"addressing table must be an array",
		);
	}

	const addressing_table: EventAddressingTable = [];
	let i = 0;
	for (const jwt of raw_addressing_table) {
		try {
			const { hash, encryption_key } = decodeJwt<EventAddressingRecord>(jwt);

			const addressing_record = { hash, encryption_key };

			if (!hash) {
				throw new OauthError(
					400,
					"invalid_request",
					`hash parameter is is missing at #/addressing_table/${i}`,
				);
			}

			if (!encryption_key) {
				throw new OauthError(
					400,
					"invalid_request",
					`encryption key parameter is is missing at #/addressing_table/${i}`,
				);
			}

			addressing_table.push({
				jwt,
				...addressing_record,
			});
		} catch (error) {
			if (error instanceof OauthError) {
				throw error;
			}

			throw new OauthError(
				400,
				"invalid_request",
				`#/addressing_table/${i} must be a valid jwt`,
				{ error },
			);
		}

		i++;
	}

	const events = expressRequest.body.events;

	if (!events) {
		throw new OauthError(
			400,
			"invalid_request",
			"events parameter is required",
		);
	}

	if (!Array.isArray(events)) {
		throw new OauthError(400, "invalid_request", "events must be an array");
	}

	let j = 0;
	for (const event of events) {
		if (!event || !(typeof event === "object")) {
			throw new OauthError(
				400,
				"invalid_request",
				`#/event/${j} must be an object`,
			);
		}

		const hash = event.hash;
		if (!hash) {
			throw new OauthError(
				400,
				"invalid_request",
				`hash parameter is is missing at #/events/${j}`,
			);
		}

		const payload = event.payload;
		if (!payload) {
			throw new OauthError(
				400,
				"invalid_request",
				`payload parameter is is missing at #/events/${j}`,
			);
		}

		// TODO move in validation
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

		j++;
	}

	return { credentials, addressing_table, events };
}

function errorData(expressRequest: Request) {
	return { hash: expressRequest.params.hash };
}
