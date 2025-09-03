import Ajv from "ajv";
import type { Config } from "../config";
import { OauthError } from "../errors";
import type { IssuerMetadata } from "../resources";
import {
	type FetchIssuerMetadataConfig,
	fetchIssuerMetadata,
	type ValidateCredentialOfferConfig,
	validateCredentialOffer,
} from "../statements";
import { locationHandlerConfigSchema } from "./schemas/locationHandlerConfig.schema";

const ajv = new Ajv();

export type LocationHandlerConfig = ValidateCredentialOfferConfig &
	FetchIssuerMetadataConfig;

type ProtocolLocation = {
	credential_offer: string | null;
};

type Protocol = "oid4vci";

type Step = "pushed_authorization_request";

type PushedAuthorizationRequestMetadata = {
	credential_configuration_ids: Array<string>;
	issuer_state: string;
	issuer_metadata: IssuerMetadata;
};

type ProtocolMetadata = {
	protocol: Protocol | null;
	nextStep?: Step;
	data?: PushedAuthorizationRequestMetadata;
};

export function locationHandlerFactory(config: LocationHandlerConfig) {
	return async function locationHandler(
		windowLocation: Location,
	): Promise<ProtocolMetadata> {
		const location = await parseLocation(windowLocation);

		if (location.credential_offer) {
			const protocol = "oid4vci";

			const { credential_issuer, credential_configuration_ids, grants } =
				await validateCredentialOffer(
					{
						credential_offer: location.credential_offer,
					},
					config,
				);

			const { issuer_metadata } = await fetchIssuerMetadata(
				{
					grants,
					credential_issuer,
				},
				config,
			);

			if (grants?.authorization_code) {
				const nextStep = "pushed_authorization_request";
				const { issuer_state } = grants.authorization_code;

				return {
					protocol,
					nextStep,
					data: {
						issuer_state,
						issuer_metadata,
						credential_configuration_ids,
					},
				};
			}

			throw new OauthError(
				400,
				"invalid_location",
				"credential offer grants is not supported",
			);
		}

		return {
			protocol: null,
		};
	};
}

export function validateLocationHandlerConfig(config: Config) {
	const validate = ajv.compile(locationHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate handler template configuration - ${errorText}`,
		);
	}
}

async function parseLocation(
	windowLocation: Location,
): Promise<ProtocolLocation> {
	const searchParams = new URLSearchParams(windowLocation.search);

	const credential_offer = searchParams.get("credential_offer");

	return { credential_offer };
}
