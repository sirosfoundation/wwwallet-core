import { exportJWK, generateKeyPair } from "jose";
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

export const clientStateStoreMock = (
	clientState: Record<string, unknown> = {},
) => {
	const code_verifier = "code_verifier";
	const state = "state";
	const clientStateStoreMock = {
		_clientState: null,
		async create(issuer: string, issuer_state: string) {
			const { publicKey, privateKey } = await generateKeyPair("ES256", {
				extractable: true,
			});

			return {
				issuer,
				issuer_state,
				state,
				code_verifier,
				dpopKeyPair: {
					publicKey: await exportJWK(publicKey),
					privateKey: {
						alg: "ES256",
						...(await exportJWK(privateKey)),
					},
				},
			};
		},
		async commitChanges(clientState: ClientState) {
			// @ts-ignore
			clientStateStoreMock._clientState = clientState;
			return clientState;
		},
		async fromIssuerState(issuer: string, issuer_state: string) {
			const { publicKey, privateKey } = await generateKeyPair("ES256", {
				extractable: true,
			});

			return {
				issuer,
				issuer_state,
				state,
				code_verifier,
				dpopKeyPair: {
					publicKey: await exportJWK(publicKey),
					privateKey: {
						alg: "ES256",
						...(await exportJWK(privateKey)),
					},
				},
				...clientState,
			};
		},
		async fromState(state: string) {
			const { publicKey, privateKey } = await generateKeyPair("ES256", {
				extractable: true,
			});

			return {
				issuer: "http://issuer.url",
				issuer_state: "issuer_state",
				state,
				code_verifier,
				dpopKeyPair: {
					publicKey: await exportJWK(publicKey),
					privateKey: {
						alg: "ES256",
						...(await exportJWK(privateKey)),
					},
				},
				...clientState,
			};
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

	return clientStateStoreMock;
};

export const httpClientPostMock = (data?: unknown) => {
	return async <T>(
		_url: string,
		_body?: unknown,
		_config?: { headers: Record<string, string> },
	) => {
		return { data: data as T };
	};
};
