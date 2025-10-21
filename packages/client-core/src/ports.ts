import type { ClientState, IssuerMetadata } from "./resources";

export type ClientStateStore = {
	create(issuer: string, issuer_state: string): Promise<ClientState>;
	commitChanges(clientState: ClientState): Promise<ClientState>;
	cleanupExpired?(): Promise<void>;
	fromIssuerState(issuer: string, issuer_state: string): Promise<ClientState>;
	fromState(state: string): Promise<ClientState>;
	setCredentialConfigurationIds(
		clientState: ClientState,
		credentialConfigurationIds: Array<string>,
	): Promise<ClientState>;
	setIssuerMetadata(
		clientState: ClientState,
		issuerMetadata: IssuerMetadata,
	): Promise<ClientState>;
};

export type HttpClient = {
	get: <T>(url: string) => Promise<{ data: T }>;
	post: <T>(
		url: string,
		body?: unknown,
		config?: { headers: Record<string, string> },
	) => Promise<{ data: T }>;
};
