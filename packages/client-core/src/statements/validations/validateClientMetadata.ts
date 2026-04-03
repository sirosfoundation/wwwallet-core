import Ajv from "ajv";
import { OauthError } from "../../errors";
import type { ClientMetadata } from "../../resources";

const ajv = new Ajv();

const clientMetadataSchema = {
	type: "object",
	properties: {
		jwks: {
			type: "object",
			properties: {
				keys: { type: "array", items: { type: "object" } },
			},
			required: ["keys"],
		},
		encrypted_response_enc_values_supported: {
			type: "array",
			items: { type: "string" },
		},
		vp_formats_supported: { type: "object" },
	},
	required: [],
	// TODO require vp_formats_supported in client metadata
	// required: ["vp_formats_supported"],
};

export type ValidateClientMetadataParams = {
	client_metadata: unknown;
};

export type ValidateClientMetadataConfig = {};

/**
 * Validates client metadata structure and returns normalized metadata.
 *
 * ### Why (Security)
 * Schema-level validation blocks malformed metadata from reaching security-sensitive logic.
 *
 * ### Specifications
 * - OpenID4VP, client metadata in authorization requests
 * - OpenID4VP, vp_formats_supported metadata
 * - OpenID client metadata validation model
 */
export async function validateClientMetadata(
	{ client_metadata }: ValidateClientMetadataParams,
	_config: ValidateClientMetadataConfig,
) {
	if (!client_metadata) {
		return { client_metadata: null };
	}

	const validate = ajv.compile(clientMetadataSchema);
	if (!validate(client_metadata)) {
		const error = validate.errors;

		throw new OauthError(
			"invalid_location",
			`could not validate client metadata`,
			{ error },
		);
	}

	return { client_metadata: client_metadata as ClientMetadata };
}
