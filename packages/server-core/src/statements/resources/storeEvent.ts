import type { EventStore } from "../../config";
import { OauthError } from "../../errors";
import type {
	EventAddressingTable,
	StorageToken,
	WalletEvent,
} from "../../resources";

export type StoreEventParams = {
	storage_token: StorageToken;
	events: Array<WalletEvent>;
	addressing_table: EventAddressingTable;
};

export type StoreEventConfig = {
	eventStore: EventStore;
};

export async function storeEvent(
	{ storage_token, addressing_table, events }: StoreEventParams,
	config: StoreEventConfig,
) {
	if (!events.length) {
		return { events };
	}

	// TODO make a transaction
	try {
		await config.eventStore.write(storage_token, addressing_table, events);
	} catch (error) {
		throw new OauthError(
			400,
			"invalid_request",
			(error as Error).message.toLowerCase(),
		);
	}

	return { events };
}
