import { OauthError } from "../../errors";
import type { ClientState, IssuerMetadata } from "../../resources";
import {
	type ClientStateConfig,
	clientState,
	type FetchAccessTokenConfig,
	type FetchIssuerMetadataConfig,
	type FetchNonceConfig,
	fetchAccessToken,
	fetchIssuerMetadata,
	fetchNonce,
	type GenerateDpopConfig,
	generateDpop,
	type IssuerClientConfig,
	issuerClient,
} from "../../statements";

export type AuthorizationCodeConfig = ClientStateConfig &
	IssuerClientConfig &
	FetchIssuerMetadataConfig &
	FetchAccessTokenConfig &
	FetchNonceConfig &
	GenerateDpopConfig;

type AuthorizationCodeProtocol = "oid4vci";

type AuthorizationCodeNextStep = "credential_request";

export type AuthorizationCodeLocation = {
	state: string | null;
	code: string | null;
};

export type AuthorizationCodeResponse = {
	protocol: AuthorizationCodeProtocol;
	nextStep: AuthorizationCodeNextStep;
	data: {
		issuer_metadata: IssuerMetadata;
		state: string;
		client_state: ClientState;
		token_type: string;
		access_token: string;
		expires_in: number;
		c_nonce: string;
		c_nonce_expires_in: number;
		refresh_token: string;
	};
};

const protocol = "oid4vci";
const nextStep = "credential_request";

export async function handleAuthorizationCode(
	params: AuthorizationCodeLocation,
	config: AuthorizationCodeConfig,
): Promise<AuthorizationCodeResponse> {
	try {
		return await doHandleAuthorizationCode(params, config);
	} catch (error) {
		if (error instanceof OauthError) {
			throw error.toResponse({ protocol, nextStep });
		}

		throw error;
	}
}

async function doHandleAuthorizationCode(
	{ state, code }: AuthorizationCodeLocation,
	config: AuthorizationCodeConfig,
): Promise<AuthorizationCodeResponse> {
	if (!state) {
		throw new OauthError("invalid_location", "state parameter is missing");
	}

	if (!code) {
		throw new OauthError("invalid_location", "code parameter is missing");
	}

	const { client_state } = await clientState({ state }, config);

	const { client } = await issuerClient(
		{
			issuer: client_state.issuer,
		},
		config,
	);

	const { issuer_metadata } = await fetchIssuerMetadata(
		{
			client_state,
			issuer: client_state.issuer,
		},
		config,
	);

	const { dpop: accessTokenDpop } = await generateDpop(
		{
			client_state,
			htu: issuer_metadata.token_endpoint,
			htm: "POST",
		},
		config,
	);

	const { token_type, access_token, expires_in, refresh_token } =
		await fetchAccessToken(
			{
				client,
				client_state,
				issuer_metadata,
				dpop: accessTokenDpop,
				code,
			},
			config,
		);

	const { dpop: nonceDpop } = await generateDpop(
		{
			client_state,
			access_token,
			htm: issuer_metadata.nonce_endpoint,
			htu: "POST",
		},
		config,
	);

	const { c_nonce, c_nonce_expires_in } = await fetchNonce(
		{
			dpop: nonceDpop,
			issuer_metadata,
		},
		config,
	);

	return {
		protocol,
		nextStep,
		data: {
			issuer_metadata,
			state,
			client_state,
			token_type,
			access_token,
			expires_in,
			c_nonce,
			c_nonce_expires_in,
			refresh_token,
		},
	};
}
