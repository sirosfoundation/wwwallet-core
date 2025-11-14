import type { DcqlQuery } from "dcql";
import type {
	ClientState,
	IssuerMetadata,
	PresentationCredential,
	PresentationRequest,
	PresentationResponse,
} from "./resources";

export interface ClientStateStore {
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
}

export interface PresentationCredentialsStore {
	fromDcqlQuery(
		dcql_query: DcqlQuery.Output | null,
	): Promise<Array<PresentationCredential>>;
}

export interface VpTokenSigner {
	sign?(
		payload: Record<string, Array<string>>,
		presentation_request: PresentationRequest,
	): Promise<string>;
	encryptResponse?(
		response: PresentationResponse,
		presentation_request: PresentationRequest,
	): Promise<string>;
}

export interface HttpClient {
	get: <T>(url: string) => Promise<{ data: T }>;
	post: <T>(
		url: string,
		body?: unknown,
		config?: { headers: Record<string, string> },
	) => Promise<{ data: T }>;
}
