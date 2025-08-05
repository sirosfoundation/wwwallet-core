import type { Request, Response } from "express";

export async function credentialOfferHandler(expressRequest: Request) {
	const scope = req.params.scope;
	const supportedCredentialConfig = credentialConfigurationRegistryService
		.getAllRegisteredCredentialConfigurations()
		.filter((sc) => sc.getScope() == scope)[0];
	if (supportedCredentialConfig) {
		const supportedCredentialType =
			supportedCredentialConfig.exportCredentialSupportedObject();

		req.session.authenticationChain = {};
		const result =
			await openidForCredentialIssuingAuthorizationServerService.generateCredentialOfferURL(
				{ req, res },
				[supportedCredentialConfig.getId()],
			);

		let credentialOfferQR = (await new Promise((resolve) => {
			qrcode.toDataURL(
				result.url
					.toString()
					.replace(config.wwwalletURL, "openid-credential-offer://"),
				{
					margin: 1,
					errorCorrectionLevel: "L",
					type: "image/png",
				},
				(err, data) => {
					if (err) return resolve("NO_QR");
					return resolve(data);
				},
			);
		})) as string;

		return {
			credentialOfferURL: result.url,
			credentialOfferQR,
			supportedCredentialType,
		};
	}
}

async function generateCredentialOfferURL(
	ctx: { req: Request; res: Response },
	credentialConfigurationIds: string[],
	issuerState?: string,
): Promise<{
	url: URL;
	user_pin_required?: boolean;
	user_pin?: string | undefined;
}> {
	// force creation of new state with a separate pre-authorized_code which has specific scope
	let newAuthorizationServerState: AuthorizationServerState = {
		...ctx.req.authorizationServerState,
		id: 0,
	} as AuthorizationServerState;
	newAuthorizationServerState.credential_configuration_ids =
		credentialConfigurationIds;

	if (issuerState) {
		newAuthorizationServerState.issuer_state = issuerState;
	}

	const insertRes = await this.authorizationServerStateRepository.insert(
		newAuthorizationServerState,
	);
	console.log("Insertion result = ", insertRes);

	const credentialOffer = {
		credential_issuer: config.url,
		credential_configuration_ids: credentialConfigurationIds,
		grants: {},
	};

	if (issuerState) {
		// if issuer state was provided
		credentialOffer.grants = {
			authorization_code: {
				issuer_state: issuerState,
			},
		};
	} else {
		credentialOffer.grants = {
			authorization_code: {},
		};
	}

	const redirect_uri =
		ctx.req?.authorizationServerState?.redirect_uri ?? config.wwwalletURL;
	const credentialOfferURL = new URL(redirect_uri);
	credentialOfferURL.searchParams.append(
		"credential_offer",
		JSON.stringify(credentialOffer),
	);

	console.log("Credential offer = ", credentialOfferURL);
	return {
		url: credentialOfferURL,
		user_pin_required: newAuthorizationServerState.user_pin_required,
		user_pin: newAuthorizationServerState.user_pin,
	};
}
