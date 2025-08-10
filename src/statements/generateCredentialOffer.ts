import qrcode from "qrcode";
import { OauthError } from "../errors";
import type {
	AuthorizationServerState,
	CredentialOffer,
	IssuerGrants,
} from "../resources";

type GenerateCredentialOfferParams = {
	authorizationServerState: AuthorizationServerState;
	grants: IssuerGrants;
	scope: string;
};

export type GenerateCredentialOfferConfig = {
	databaseOperations: {
		insertAuthorizationServerState: (
			authorizationServerState: AuthorizationServerState,
		) => Promise<AuthorizationServerState>;
	};
	issuer_url: string;
	wallet_url: string;
	supported_credential_configurations: Array<{
		credential_configuration_id: string;
		label?: string;
		scope: string;
		format: string;
		vct?: string;
	}>;
};

export async function generateCredentialOffer(
	{ authorizationServerState, grants, scope }: GenerateCredentialOfferParams,
	config: GenerateCredentialOfferConfig,
) {
	const credentialConfigurations =
		config.supported_credential_configurations.filter((configuration) => {
			return scope.split(" ").includes(configuration.scope);
		});

	if (!credentialConfigurations.length) {
		throw new OauthError(
			404,
			"invalid_request",
			"credential not supported by the issuer",
		);
	}

	const credential_configuration_ids = credentialConfigurations.map(
		(configuration) => {
			return configuration.credential_configuration_id;
		},
	);

	authorizationServerState.credential_configuration_ids =
		credential_configuration_ids;
	authorizationServerState.issuer_state =
		grants.authorization_code.issuer_state;

	const credentialOffer = {
		credential_issuer: config.issuer_url,
		credential_configuration_ids,
		grants,
	};

	const credentialOfferUrl = generateCredentialOfferUrl(
		credentialOffer,
		config,
	);
	const credentialOfferQrCode = await generateCredentialOfferQrCode(
		credentialOfferUrl,
		config,
	);

	await config.databaseOperations.insertAuthorizationServerState(
		authorizationServerState,
	);

	return {
		credentialOfferQrCode,
		credentialOfferUrl,
		credentialConfigurations,
	};
}

function generateCredentialOfferUrl(
	credentialOffer: CredentialOffer,
	config: GenerateCredentialOfferConfig,
) {
	const redirect_uri = config.wallet_url;

	const credentialOfferUrl = new URL(redirect_uri);
	credentialOfferUrl.searchParams.append(
		"credential_offer",
		JSON.stringify(credentialOffer),
	);

	return credentialOfferUrl.toString();
}

async function generateCredentialOfferQrCode(
	credentialOfferUrl: string,
	config: GenerateCredentialOfferConfig,
): Promise<string> {
	return new Promise((resolve, reject) => {
		qrcode.toDataURL(
			credentialOfferUrl.replace(
				config.wallet_url,
				"openid-credential-offer://",
			),
			{
				margin: 1,
				errorCorrectionLevel: "L",
				type: "image/png",
			},
			(err, data) => {
				if (err) return reject(err);
				return resolve(data);
			},
		);
	});
}
