import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { OauthError } from "../../errors";
import type { StorageToken } from "../../resources";

export type FetchEventsParams = {
	storage_token: StorageToken;
};

export type FetchEventsConfig = {
	events_path: string;
};

export async function fetchEvents(
	{ storage_token }: FetchEventsParams,
	config: FetchEventsConfig,
): Promise<{ events: Record<string, string> }> {
	const eventDirname = crypto.createHash("sha256");
	eventDirname.update(storage_token.payload.keyid);
	const eventDirPath = path.join(
		process.cwd(),
		config.events_path,
		eventDirname.digest("base64url"),
	);

	if (!fs.existsSync(eventDirPath)) {
		return { events: {} };
	}

	const events: Record<string, string> = {};
	try {
		const eventFiles = fs.readdirSync(eventDirPath);

		await Promise.all(
			eventFiles.map(async (eventFilename) => {
				const eventPath = path.join(eventDirPath, eventFilename);

				const event = await fs.promises.readFile(eventPath);
				events[eventFilename] = event.toString();
			}),
		);
	} catch (error) {
		throw new OauthError(
			500,
			"unknown_error",
			(error as Error).message.toLowerCase(),
		);
	}

	return { events };
}
