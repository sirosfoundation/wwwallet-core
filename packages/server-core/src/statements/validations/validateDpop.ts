import crypto from "node:crypto";
import {
	decodeProtectedHeader,
	jwtVerify,
	type ProtectedHeaderParameters,
} from "jose";
import { OauthError } from "../../errors";

export type ValidateDpopParams = {
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

export async function validateDpop(
	{ dpop, dpopRequest, access_token }: ValidateDpopParams,
	config: ValidateDpopConfig,
): Promise<unknown> {
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

		const { htm, htu, ath } = payload;

		if (dpopRequest.method.toLowerCase() !== htm.toLowerCase()) {
			throw new OauthError(400, "invalid_request", "invalid dpop htm value");
		}

		if (new URL(dpopRequest.uri, config.issuer_url).toString() !== htu) {
			throw new OauthError(400, "invalid_request", "invalid dpop htu value");
		}

		const accessTokenHash = crypto.createHash("sha256");
		accessTokenHash.update(access_token);
		if (accessTokenHash.digest("base64url") !== ath) {
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

	if (!dpopHeader.alg.match(/ES|RS|EdDSA/)) {
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
