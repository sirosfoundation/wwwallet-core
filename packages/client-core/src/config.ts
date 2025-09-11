import type { OauthClient } from "./resources";

export type RequestHeaders = {
	[key: string]: string;
};

export type Config = {
	httpClient?: {
		get?: <T>(url: string) => Promise<{ data: T }>;
		post?: <T>(
			url: string,
			body?: unknown,
			config?: { headers: RequestHeaders },
		) => Promise<{ data: T }>;
	};
	static_clients?: Array<OauthClient>;
	wallet_url?: string;
};
