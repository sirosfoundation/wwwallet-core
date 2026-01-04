import type {
	EventAddressingRecord,
	EventAddressingTable,
	StorageToken,
	WalletEvent,
} from "@wwwallet/server-core";
import { decodeJwt } from "jose";
import type { RedisClientType } from "redis";

export type RedisEventStoreConfig = {
	client: RedisClientType;
};

export class RedisEventStore {
	client: RedisClientType;

	constructor({ client }: RedisEventStoreConfig) {
		this.client = client;
	}

	async get(storage_token: StorageToken) {
		const addressing_table = await this.client
			.keys(`${storage_token.payload.keyid}.table:*`)
			.then(async (keys) => {
				const addressing_records = await Promise.all(
					keys.map((key) => this.client.get(key)),
				);

				return addressing_records.filter((e) => e);
			});
		const events = await Promise.all(
			addressing_table
				.map((jwt) => {
					const { hash, encryption_key } = decodeJwt<EventAddressingRecord>(
						jwt as string,
					);

					return { hash, encryption_key };
				})
				.map(async ({ hash, encryption_key }) => {
					const event = await this.client.get(`events:${hash}`);

					if (event) {
						return {
							hash,
							payload: event.toString(),
							encryption_key,
						};
					}
				}),
		);

		return { events: events.filter((e) => e) as Array<WalletEvent> };
	}

	async write(
		storage_token: StorageToken,
		addressing_table: EventAddressingTable,
		events: Array<WalletEvent>,
	) {
		let i = 0;
		for (const { hash, payload } of events) {
			const addressing_record = addressing_table.find(
				({ hash: address }) => address === hash,
			);

			if (!addressing_record) {
				throw new Error("addressing record could not be found");
			}

			if (await this.client.get(`events:${hash}`)) {
				throw new Error(`#/events/${i}/hash already exists`);
			}

			this.client.set(`events:${hash}`, payload);
			this.client.set(
				`${storage_token.payload.keyid}.table:${hash}`,
				addressing_record.jwt,
			);
			i++;
		}
	}
}
