import qrcode from "qrcode";
import { OauthError } from "../../errors";
import type {
	CredentialConfiguration,
	CredentialOffer,
	IssuerGrants,
} from "../../resources";

export type GenerateCredentialOfferParams = {
	grants: IssuerGrants;
	scope: string;
};

export type GenerateCredentialOfferConfig = {
	issuer_url: string;
	wallet_url: string;
	supported_credential_configurations: Array<CredentialConfiguration>;
};

export async function generateCredentialOffer(
	{ grants, scope }: GenerateCredentialOfferParams,
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
