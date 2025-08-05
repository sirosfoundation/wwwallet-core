import type { Request } from "express";
import * as qrcode from "qrcode";
import type { Config } from "../core";
import { OauthError } from "../errors";
import type { AuthorizationServerState } from "../resources";

export async function credentialOfferHandler(
	expressRequest: Request,
	config: Config,
) {
	const scope = expressRequest.params.scope;
	const supportedCredentialConfig =
		getAllRegisteredCredentialConfigurations().filter(
			(sc) => sc.getScope() === scope,
		)[0];
	if (supportedCredentialConfig) {
		const supportedCredentialType =
			supportedCredentialConfig.exportCredentialSupportedObject();

		// expressRequest.session.authenticationChain = {};
		const result = await generateCredentialOfferURL(
			{ req: expressRequest },
			[supportedCredentialConfig.getId()],
			config,
		);

		const credentialOfferQR = (await new Promise((resolve) => {
			qrcode.toDataURL(
				result.url
					.toString()
					.replace(config.wallet_url, "openid-credential-offer://"),
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
			credentialOfferUrl: result.url,
			credentialOfferQrCode: credentialOfferQR,
			supportedCredentialType,
		};
	}

	throw new OauthError(404, "invalid_request", "credential not found");
}

function getAllRegisteredCredentialConfigurations(): Array<{
	getScope: () => string;
	exportCredentialSupportedObject: () => unknown;
	getId: () => string;
}> {
	return [];
}

async function generateCredentialOfferURL(
	ctx: { req: Request },
	credentialConfigurationIds: string[],
	config: Config,
): Promise<{
	url: URL;
	user_pin_required?: boolean;
	user_pin?: string | undefined;
}> {
	const issuerState = "issuer_state";
	// force creation of new state with a separate pre-authorized_code which has specific scope
	const newAuthorizationServerState: AuthorizationServerState = {
		// @ts-ignore
		...ctx.req.authorizationServerState,
		id: 0,
	} as AuthorizationServerState;
	newAuthorizationServerState.credential_configuration_ids =
		credentialConfigurationIds;

	if (issuerState) {
		newAuthorizationServerState.issuer_state = issuerState;
	}

	const insertRes =
		await config.databaseOperations.insertAuthorizationServerState(
			newAuthorizationServerState,
		);
	console.log("Insertion result = ", insertRes);

	const credentialOffer = {
		credential_issuer: config.issuer_url,
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
		// @ts-ignore
		ctx.req?.authorizationServerState?.redirect_uri ?? config.wallet_url;
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
