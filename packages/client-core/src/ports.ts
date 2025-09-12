import type { IssuerMetadata } from "./resources";

export interface ClientState {
	issuer: string;
	issuer_state: string;
	state?: string;
	credential_configuration_ids?: Array<string>;
	issuerMetadata?: IssuerMetadata;
}

export type ClientStateStore = {
	create(issuer: string, issuer_state: string): Promise<ClientState>;
	fromIssuerState(issuer: string, issuer_state: string): Promise<ClientState>;
	setCredentialConfigurationIds(
		clientState: ClientState,
		credentialConfigurationIds: Array<string>,
	): Promise<ClientState>;
	setIssuerMetadata(
		clientState: ClientState,
		issuerMetadata: IssuerMetadata,
	): Promise<ClientState>;
};

export type RequestHeaders = {
	[key: string]: string;
};

export type HttpClient = {
	get?: <T>(url: string) => Promise<{ data: T }>;
	post?: <T>(
		url: string,
		body?: unknown,
		config?: { headers: RequestHeaders },
	) => Promise<{ data: T }>;
};
