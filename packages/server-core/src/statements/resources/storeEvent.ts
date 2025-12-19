import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
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
	events_path: string;
	event_tables_path: string;
};

export async function storeEvent(
	{ storage_token, addressing_table, events }: StoreEventParams,
	config: StoreEventConfig,
) {
	if (!events.length) {
		return { events };
	}

	const eventTableName = crypto
		.createHash("sha256")
		.update(storage_token.payload.keyid)
		.digest("base64url");
	const eventDirPath = path.join(process.cwd(), config.events_path);
	const eventTablePath = path.join(
		process.cwd(),
		config.event_tables_path,
		`${eventTableName}.table`,
	);

	// TODO make a transaction
	try {
		for (const { hash, payload } of events) {
			const addressing_record = addressing_table.find(
				({ hash: address }) => address === hash,
			);
			if (!addressing_record) {
				throw new Error("addressing record could not be found");
			}

			fs.writeFileSync(path.join(eventDirPath, hash), Buffer.from(payload));
			fs.appendFileSync(
				eventTablePath,
				Buffer.from(`${addressing_record.jwt}\n`),
			);
		}
	} catch (error) {
		throw new OauthError(
			400,
			"invalid_request",
			(error as Error).message.toLowerCase(),
		);
	}

	return { events };
}
