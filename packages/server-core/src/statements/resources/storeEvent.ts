import fs from "node:fs";
import path from "node:path";
import { OauthError } from "../../errors";
import type { StorageToken } from "../../resources";

export type StoreEventParams = {
	storage_token: StorageToken;
	hash: string;
	payload: string;
};

export type StoreEventConfig = {
	events_path: string;
};

export async function storeEvent(
	{ storage_token, hash, payload }: StoreEventParams,
	config: StoreEventConfig,
) {
	const eventDirPath = path.join(
		process.cwd(),
		config.events_path,
		storage_token.payload.keyid,
	);

	try {
		if (!fs.existsSync(eventDirPath)) {
			fs.mkdirSync(eventDirPath);
		}
		fs.writeFileSync(path.join(eventDirPath, hash), Buffer.from(payload));
	} catch (error) {
		throw new OauthError(
			400,
			"invalid_request",
			(error as Error).message.toLowerCase(),
		);
	}

	return { event: { [hash]: payload } };
}
