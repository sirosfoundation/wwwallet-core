import type { ClientStateStore, HttpClient } from "./ports";
import type { OauthClient } from "./resources";

export type Config = {
	httpClient?: HttpClient;
	clientStateStore?: ClientStateStore;
	static_clients?: Array<OauthClient>;
	wallet_url?: string;
};
