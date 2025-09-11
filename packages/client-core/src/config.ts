import type { OauthClient } from "./resources";

export type Config = {
	httpClient?: {
		get?: <T>(url: string) => Promise<{ data: T }>;
		post?: <T>(url: string, body?: unknown) => Promise<{ data: T }>;
	};
	static_clients?: Array<OauthClient>;
	wallet_url?: string;
};
