import type { EventStore } from "../../config";
import { OauthError } from "../../errors";
import type { StorageToken } from "../../resources";

export type FetchEventsParams = {
	storage_token: StorageToken;
};

export type FetchEventsConfig = {
	eventStore: EventStore;
};

export async function fetchEvents(
	{ storage_token }: FetchEventsParams,
	config: FetchEventsConfig,
) {
	try {
		return await config.eventStore.get(storage_token);
	} catch (error) {
		throw new OauthError(
			500,
			"unknown_error",
			(error as Error).message.toLowerCase(),
		);
	}
}
