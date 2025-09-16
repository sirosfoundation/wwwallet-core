import { OauthError } from "../../errors";
import {
	type ClientStateConfig,
	clientState,
	type FetchIssuerMetadataConfig,
	fetchIssuerMetadata,
	type GenerateDpopConfig,
	generateDpop,
} from "../../statements";

export type AuthorizationCodeConfig = ClientStateConfig &
	FetchIssuerMetadataConfig &
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
		access_token: string;
		nonce: string;
	};
};

const protocol = "oid4vci";
const nextStep = "credential_request";

export async function handleAuthorizationCode(
	{ state, code }: AuthorizationCodeLocation,
	config: AuthorizationCodeConfig,
): Promise<AuthorizationCodeResponse> {
	if (!state) {
		throw new OauthError(400, "invalid_location", "state parameter is missing");
	}

	if (!code) {
		throw new OauthError(400, "invalid_location", "code parameter is missing");
	}

	const { client_state: initialClientState } = await clientState(
		{ state },
		config,
	);

	const { issuer_metadata, client_state: _issuerMetadataClientState } =
		await fetchIssuerMetadata(
			{
				client_state: initialClientState,
			},
			config,
		);

	const { dpop: accessTokenDpop } = await generateDpop(
		{ htm: issuer_metadata.token_endpoint, htu: "POST" },
		config,
	);

	// const { access_token, client_state: _accessTokenClientState } =
	// 	await fetchAccessToken(
	// 		{
	// 			issuer_metadata,
	// 			dpop: accessTokenDpop,
	// 			code,
	// 		},
	// 		config,
	// 	);

	const { dpop: nonceDpop } = await generateDpop(
		{
			// access_token,
			htm: issuer_metadata.nonce_endpoint,
			htu: "POST",
		},
		config,
	);

	// const { nonce, client_state: _nonceClientState } = await fetchNonce(
	// 	{
	// 		dpop: nonceDpop,
	// 		issuer_metadata,
	// 	},
	// 	config,
	// );

	return {
		protocol,
		nextStep,
		data: {
			access_token: accessTokenDpop,
			nonce: nonceDpop,
		},
	};
}
