import crypto from "node:crypto";
import {
	decodeProtectedHeader,
	jwtVerify,
	type ProtectedHeaderParameters,
} from "jose";
import { OauthError } from "../../errors";

export type ValidateDpopParams = {
	token_type?: string;
	access_token: string;
	dpop?: string | string[] | undefined;
	dpopRequest?: {
		method: string;
		uri: string;
	};
};

export type ValidateDpopConfig = {
	issuer_url: string;
};

/**
 * Validates authorization token type (`DPoP`/`Bearer`), then validates DPoP
 * JWT header, signature, required claims, and request/access token binding
 * (`htm`, `htu`, `ath`).
 *
 * ## Why
 * Enforcing accepted authorization token types and DPoP proof validation keeps
 * token usage aligned with sender-constrained expectations and reduces replay
 * and token theft impact.
 *
 * ## Specification
 * - OAuth 2.0 Demonstrating Proof-of-Possession (DPoP), RFC 9449.
 */
export async function validateDpop(
	{ token_type, dpop, dpopRequest, access_token }: ValidateDpopParams,
	config: ValidateDpopConfig,
): Promise<unknown> {
	if (!token_type || !token_type.match(/^(DPoP|[Bb]earer)$/)) {
		throw new OauthError(
			400,
			"invalid_request",
			"access token type is invalid",
		);
	}

	if (!dpop || !dpopRequest) {
		throw new OauthError(
			400,
			"invalid_request",
			"request requires a dpop value",
		);
	}

	if (Array.isArray(dpop)) {
		throw new OauthError(
			400,
			"invalid_request",
			"no more than one dpop value is accepted",
		);
	}

	const { jwk } = await validateDpopHeader(dpop);

	try {
		const { payload } = await jwtVerify<{
			jti: string;
			htm: string;
			htu: string;
			iat: number;
			ath: string;
		}>(dpop, jwk);

		for (const claim of ["jti", "htm", "htu", "iat", "ath"]) {
			if (!payload[claim]) {
				throw new OauthError(
					400,
					"invalid_request",
					`${claim} claim is missing in dpop jwt payload`,
				);
			}
		}
		if (
			typeof payload.jti !== "string" ||
			typeof payload.htm !== "string" ||
			typeof payload.htu !== "string" ||
			typeof payload.ath !== "string" ||
			!Number.isInteger(payload.iat) ||
			payload.iat <= 0
		) {
			throw new OauthError(
				400,
				"invalid_request",
				"dpop jwt payload claims are invalid",
			);
		}

		const { htm, htu, ath } = payload;

		if (dpopRequest.method.toLowerCase() !== htm.toLowerCase()) {
			throw new OauthError(400, "invalid_request", "invalid dpop htm value");
		}

		if (new URL(dpopRequest.uri, config.issuer_url).toString() !== htu) {
			throw new OauthError(400, "invalid_request", "invalid dpop htu value");
		}

		const accessTokenHash = crypto.createHash("sha256");
		accessTokenHash.update(access_token);
		const expectedAth = Buffer.from(accessTokenHash.digest("base64url"));
		const providedAth = Buffer.from(ath);
		const matchesAth =
			expectedAth.length === providedAth.length &&
			crypto.timingSafeEqual(expectedAth, providedAth);
		if (!matchesAth) {
			throw new OauthError(400, "invalid_request", "invalid dpop ath value");
		}

		return {
			htm,
			htu,
			ath,
		};
	} catch (error) {
		if (error instanceof OauthError) {
			throw error;
		}

		throw new OauthError(400, "invalid_request", "invalid dpop jwt");
	}
}

async function validateDpopHeader(dpop: string) {
	let dpopHeader: ProtectedHeaderParameters;

	try {
		dpopHeader = decodeProtectedHeader(dpop);
	} catch (_error) {
		throw new OauthError(400, "invalid_request", "dpop jwt header is invalid");
	}

	if (dpopHeader.typ !== "dpop+jwt") {
		throw new OauthError(
			400,
			"invalid_request",
			"dpop jwt typ header must have dpop+jwt value",
		);
	}

	if (!dpopHeader.alg) {
		throw new OauthError(
			400,
			"invalid_request",
			"alg is missing from dpop jwt header",
		);
	}

	if (!dpopHeader.jwk) {
		throw new OauthError(
			400,
			"invalid_request",
			"jwk is missing from dpop jwt header",
		);
	}

	if (
		!dpopHeader.alg.match(
			/^(ES(256|384|512)|RS(256|384|512)|PS(256|384|512)|EdDSA)$/,
		)
	) {
		throw new OauthError(
			400,
			"invalid_request",
			"dpop jwt must be signed with an asymetric key",
		);
	}

	return {
		typ: dpopHeader.typ,
		alg: dpopHeader.alg,
		jwk: dpopHeader.jwk,
	};
}
