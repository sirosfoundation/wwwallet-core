import fs from "node:fs";
import path from "node:path";
import { decodeJwt } from "jose";
import { OauthError } from "../../errors";
import type { EventAddressingRecord, StorageToken } from "../../resources";

export type FetchEventsParams = {
	storage_token: StorageToken;
};

export type FetchEventsConfig = {
	events_path: string;
	event_tables_path: string;
};

export async function fetchEvents(
	{ storage_token }: FetchEventsParams,
	config: FetchEventsConfig,
) {
	const eventDirPath = path.join(process.cwd(), config.events_path);
	const eventTablePath = path.join(
		process.cwd(),
		config.event_tables_path,
		`${storage_token.payload.keyid}.table`,
	);

	if (!fs.existsSync(eventTablePath)) {
		return { events: [] };
	}

	try {
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
					const eventPath = path.join(eventDirPath, hash);

					const event = await fs.promises.readFile(eventPath);
					return {
						hash,
						payload: event.toString(),
						encryption_key,
					};
				}),
		);

		return { events };
	} catch (error) {
		throw new OauthError(
			500,
			"unknown_error",
			(error as Error).message.toLowerCase(),
		);
	}
}
