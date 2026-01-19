import Ajv from "ajv";
import type { Request } from "express";
import type { Config, Logger } from "../../config";
import { OauthError, type OauthErrorResponse } from "../../errors";
import type { CredentialConfiguration } from "../../resources";
import {
	generateCredentialOffer,
	generateIssuerGrants,
	issuerClient,
	validateScope,
} from "../../statements";
import { credentialOfferHandlerConfigSchema } from "./schemas";
import crypto from 'node:crypto';

const ajv = new Ajv();

export type CredentialOfferHandlerConfig = {
	logger: Logger;
	issuer_url: string;
	wallet_url: string;
	issuer_client: {
		id: string;
		scopes: Array<string>;
	};
	secret: string;
	token_encryption: string;
	issuer_state_ttl: number;
	supported_credential_configurations: Array<CredentialConfiguration>;
};

type CredentialOfferRequest = {
	scope: string;
};

export type CredentialOfferResponse = {
	status: 200;
	data: {
		credentialOfferUrl: string;
		credentialOfferQrCode: string;
		credentialConfigurations: Array<CredentialConfiguration>;
	};
	body: {
		pre_auth_code: string;
		credential_offer_url: string;
		credential_offer_qrcode: string;
	};
};

export function credentialOfferHandlerFactory(
    config: CredentialOfferHandlerConfig,
) {
    return async function credentialOfferHandler(
        expressRequest: Request,
    ): Promise<CredentialOfferResponse | OauthErrorResponse> {
        try {
            // 1. Derive Deterministic Key
            const masterSecret = process.env.ISSUER_MASTER_SECRET || "secure-permanent-secret";
            const salt = "issuance-v1";
            
            // Generate the 32-byte seed
            const seedBuffer = crypto.scryptSync(masterSecret, salt, 32);
            const d = seedBuffer.toString('base64url');

            // 2. Create the Private Key using JWK format (Very compatible)
            // Ed25519 JWK: kty=OKP, crv=Ed25519, d=private_key_bytes
            const derivedKey = crypto.createPrivateKey({
                key: {
                    kty: 'OKP',
                    crv: 'Ed25519',
                    x: 'unused', // Public part; for import-only, Node allows junk or empty
                    d: d,
                },
                format: 'jwk',
            });

            // 3. Prepare the payload to sign
            const payload = JSON.stringify({
                iat: Math.floor(Date.now() / 1000),
                nonce: crypto.randomBytes(16).toString('hex')
            });

            const random = crypto.randomBytes(32).toString("base64url");

            const message = `stateless-grant-v1:${random}`;
			const signed = (crypto.sign as any)(
				null, 
				Buffer.from(message), 
				derivedKey
			).toString('base64url');

            const pre_auth_code = Buffer.from(
                JSON.stringify({ message, signed })
              ).toString("base64url");
            // --- Framework Standard logic ---
            const request = await validateRequest(expressRequest);
            const { client } = await issuerClient(config);
            const { scope } = await validateScope(request.scope, { client }, config);
            const { grants } = await generateIssuerGrants({ client }, config);

            // 5. Inject the Pre-Auth Grant
            (grants as any)["urn:ietf:params:oauth:grant-type:pre-authorized_code"] = {
                "pre-authorized_code": pre_auth_code,
                "user_pin_required": false 
            };

            const {
                credentialOfferUrl,
                credentialOfferQrCode,
                credentialConfigurations,
            } = await generateCredentialOffer({ grants, scope }, config);
            
            return {
                status: 200,
                data: {
                    credentialOfferUrl,
                    credentialOfferQrCode,
                    credentialConfigurations,
                },
                body: {
                    
                    pre_auth_code,
                    credential_offer_url: credentialOfferUrl,
                    credential_offer_qrcode: credentialOfferQrCode,
                },
            };
        } catch (error: any) {
            console.error("Handler Error:", error.message);
            if (error instanceof OauthError) return error.toResponse();
            throw error;
        }
    };
}

export function validateCredentialOfferHandlerConfig(config: Config) {
	const validate = ajv.compile(credentialOfferHandlerConfigSchema);
	if (!validate(config)) {
		const errorText = ajv.errorsText(validate.errors);

		throw new Error(
			`Could not validate credentialOffer handler configuration - ${errorText}`,
		);
	}
}

async function validateRequest(
	expressRequest: Request,
): Promise<CredentialOfferRequest> {
	if (!expressRequest.params) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential offer requests need path params",
		);
	}

	const { scope } = expressRequest.params;

	if (!scope) {
		throw new OauthError(
			400,
			"invalid_request",
			"credential offer requests need a scope param",
		);
	}

	return { scope };
}
