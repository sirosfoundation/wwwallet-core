import type { ClientState, IssuerMetadata } from "../../src";

export const fetchIssuerMetadataMock = (issuerMetadata: unknown) => {
	return async <T>(url: string) => {
		if (url.match(/oauth-authorization-server/)) {
			return {
				data: issuerMetadata as T,
			};
		}
		if (url.match(/openid-credential-issuer/)) {
			return {
				data: {} as T,
			};
		}
		throw new Error("not found");
	};
};

export const clientStateStoreMock = (clientState: unknown = {}) => {
	const code_verifier = "code_verifier";
	const state = "state";
	return {
		async create(issuer: string, issuer_state: string) {
			return { issuer, issuer_state, state, code_verifier };
		},
		async fromIssuerState(issuer: string, issuer_state: string) {
			// @ts-ignore
			return { issuer, issuer_state, state, code_verifier, ...clientState };
		},
		async setCredentialConfigurationIds(
			client_state: ClientState,
			credentialConfigurationIds: Array<string>,
		) {
			client_state.credential_configuration_ids = credentialConfigurationIds;
			return client_state;
		},
		async setIssuerMetadata(
			client_state: ClientState,
			issuerMetadata: IssuerMetadata,
		) {
			client_state.issuer_metadata = issuerMetadata;
			return client_state;
		},
	};
};
