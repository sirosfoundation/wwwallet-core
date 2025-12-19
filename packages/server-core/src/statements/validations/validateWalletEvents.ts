import { OauthError } from "../../errors";
import type { EventAddressingTable, WalletEvent } from "../../resources";

export type ValidateWalletEventsParams = {
	addressing_table: EventAddressingTable;
	events: Array<WalletEvent>;
};

export type ValidateWalletEventsConfig = {};

export async function validateWalletEvents(
	{ addressing_table, events }: ValidateWalletEventsParams,
	_config: ValidateWalletEventsConfig,
) {
	// TODO validate addressing records signature according to wallet
	//	attestation
	// NOTE if done the server would have the ability to link a wallet
	//	attestations to data key identifiers then associated encrypted data.
	// for (const addressing_record of addressing_table) {}

	const eventPresence = addressing_table.every(({ hash: address }) =>
		events.some(({ hash }) => address === hash),
	);

	if ((addressing_table.length && !events.length) || !eventPresence) {
		throw new OauthError(
			400,
			"invalid_request",
			"addressing table reference unknown events",
		);
	}

	const addressPresence = events.every(({ hash }) =>
		addressing_table.some(({ hash: address }) => hash === address),
	);

	if ((events.length && !addressing_table.length) || !addressPresence) {
		throw new OauthError(
			400,
			"invalid_request",
			"some events are not present in addressing table",
		);
	}

	return { events, addressing_table };
}
