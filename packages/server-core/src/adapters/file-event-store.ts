import fs from "node:fs";
import path from "node:path";
import { decodeJwt } from "jose";
import type {
	EventAddressingRecord,
	EventAddressingTable,
	StorageToken,
	WalletEvent,
} from "../resources";

export type FileEventStoreConfig = {
	events_path: string;
	event_tables_path: string;
};

export class FileEventStore {
	events_path: string;
	event_tables_path: string;

	constructor({ events_path, event_tables_path }: FileEventStoreConfig) {
		this.events_path = events_path;
		this.event_tables_path = event_tables_path;
	}

	get eventDirPath() {
		return path.join(process.cwd(), this.events_path);
	}

	async get(storage_token: StorageToken) {
		const eventTablePath = path.join(
			process.cwd(),
			this.event_tables_path,
			`${storage_token.payload.keyid}.table`,
		);

		if (!fs.existsSync(eventTablePath)) {
			return { events: [] };
		}

		const addressing_table = fs
			.readFileSync(eventTablePath)
			.toString()
			.split("\n")
			.filter((addressing_record) => addressing_record);

		const events = await Promise.all(
			addressing_table
				.map((jwt) => {
					const { hash, encryption_key } =
						decodeJwt<EventAddressingRecord>(jwt);

					return { hash, encryption_key };
				})
				.map(async ({ hash, encryption_key }) => {
					const eventPath = path.join(this.eventDirPath, hash);

					const event = await fs.promises.readFile(eventPath);
					return {
						hash,
						payload: event.toString(),
						encryption_key,
					};
				}),
		);

		return { events };
	}

	async write(
		storage_token: StorageToken,
		addressing_table: EventAddressingTable,
		events: Array<WalletEvent>,
	) {
		const eventTablePath = path.join(
			process.cwd(),
			this.event_tables_path,
			`${storage_token.payload.keyid}.table`,
		);
		let i = 0;
		for (const { hash, payload } of events) {
			const eventPath = path.join(this.eventDirPath, hash);
			const addressing_record = addressing_table.find(
				({ hash: address }) => address === hash,
			);

			if (!addressing_record) {
				throw new Error("addressing record could not be found");
			}

			if (fs.existsSync(eventPath)) {
				throw new Error(`#/events/${i}/hash already exists`);
			} else {
				// TODO find better file locking
				fs.writeFileSync(eventPath, "");
			}

			fs.writeFileSync(eventPath, Buffer.from(payload));
			fs.appendFileSync(
				eventTablePath,
				Buffer.from(`${addressing_record.jwt}\n`),
			);
			i++;
		}
	}
}
