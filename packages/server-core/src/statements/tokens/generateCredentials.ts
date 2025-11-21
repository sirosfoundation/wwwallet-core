import crypto from "node:crypto";
import { Jwt, SDJwt } from "@sd-jwt/core";
import { digest as hasher } from "@sd-jwt/crypto-nodejs";
import { Disclosure } from "@sd-jwt/utils";
import type { JWK } from "jose";
import type { EncryptConfig } from "../../crypto";
import { OauthError } from "../../errors";
import type {
	Claims,
	DeferredCredential,
	DeferredResourceOwnerData,
	ResourceOwnerData,
	SupportedCredentialConfiguration,
} from "../../resources";

export type GenerateCredentialsParams = {
	sub?: string;
	credential_configurations?: Array<SupportedCredentialConfiguration>;
	jwks?: Array<JWK>;
	defer_data?: DeferredResourceOwnerData | null;
};

export type GenerateCredentialsConfig = {
	issuer_url: string;
	dataOperations: {
		deferredResourceOwnerData: (
			data: {
				sub: string;
				data: Array<ResourceOwnerData>;
				jwks: Array<JWK>;
			},
			config: EncryptConfig,
		) => Promise<DeferredCredential>;
		resourceOwnerData: (data: {
			sub: string;
			credential_configurations: Array<SupportedCredentialConfiguration>;
		}) => Promise<Array<ResourceOwnerData>>;
	};
} & EncryptConfig;

export async function generateCredentials(
	{
		sub: inputSub,
		credential_configurations: inputCredentialConfigurations,
		jwks: inputJwks,
		defer_data,
	}: GenerateCredentialsParams,
	config: GenerateCredentialsConfig,
) {
	const { sub, data, jwks } = defer_data || {
		sub: inputSub,
		data:
			inputSub &&
			(await config.dataOperations.resourceOwnerData({
				sub: inputSub,
				credential_configurations: inputCredentialConfigurations || [],
			})),
		jwks: inputJwks,
	};

	if (!Array.isArray(data) || !data?.length) {
		throw new OauthError(404, "invalid_credential", "credential not found");
	}

	if (!sub) {
		throw new OauthError(
			404,
			"invalid_credential",
			"credential must have a subject",
		);
	}

	if (!jwks?.length) {
		throw new OauthError(
			400,
			"invalid_request",
			"holder ownership proof is required",
		);
	}

	if (defer_data) {
		const cnf = { jwk: jwks[0] };

		const credentials = await Promise.all(
			defer_data.data.map(async ({ claims, credential_configuration }) => {
				if (!claims) return { credential: "" };
				return {
					credential: await generateAndSign(
						claims,
						cnf,
						credential_configuration,
						config,
					),
				};
			}),
		);

		return {
			credentials: credentials.filter((credential) => credential),
		};
	}

	if (data.some(({ credential_configuration: { deferred } }) => deferred)) {
		const { transaction_id } =
			await config.dataOperations.deferredResourceOwnerData(
				{
					sub,
					data,
					jwks: jwks || [],
				},
				config,
			);

		return { transaction_id };
	}

	const cnf = { jwk: jwks[0] };

	const credentials = await Promise.all(
		data.map(async ({ claims, credential_configuration }) => {
			if (!claims) return { credential: "" };

			return {
				credential: await generateAndSign(
					claims,
					cnf,
					credential_configuration,
					config,
				),
			};
		}),
	);

	return {
		credentials: credentials,
	};
}

async function generateAndSign(
	claims: Claims,
	cnf: { jwk: JWK },
	credential_configuration: SupportedCredentialConfiguration,
	config: GenerateCredentialsConfig,
) {
	const alg = "sha-256";

	const disclosures = Object.keys(claims).map((key: string) => {
		const salt = saltGenerator();
		const value = claims[key];
		return new Disclosure([salt, key, value]);
	});

	const payload = {
		_sd: await Promise.all(
			disclosures.map((disclosure) =>
				disclosure.digest({
					hasher,
					alg,
				}),
			),
		),
		cnf,
		iss: config.issuer_url,
		vct: credential_configuration.vct,
	};

	const jwt = new Jwt({
		header: { alg: "ES256", typ: credential_configuration.format },
		payload,
	});
	await jwt.sign(signer());

	const sdjwt = new SDJwt({
		jwt,
		disclosures,
	});

	return sdjwt.encodeSDJwt();
}

const metadataPrivateKey = `
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgtfEWwPl5+13fqLPw
j/22afeqn/BgARhgjbtoRKcUFLyhRANCAARVYrxredzOKhD9OkE9tAUpRojCHcyy
7xvm/X6v3xyjPjRk/mt7J14j8FO1+46zhVscMo2Xnmp+NPr8ehstOlX6
-----END PRIVATE KEY-----
`;

const _metadataCertificate = `
-----BEGIN CERTIFICATE-----
MIICyzCCAnGgAwIBAgIULnrxux9sI34oqbby3M4lSKOs8owwCgYIKoZIzj0EAwIw
PzELMAkGA1UEBhMCRVUxFTATBgNVBAoMDHd3V2FsbGV0Lm9yZzEZMBcGA1UEAwwQ
d3dXYWxsZXQgUm9vdCBDQTAeFw0yNTA0MjkxMDI5NTNaFw0yNjA0MjkxMDI5NTNa
MEExCzAJBgNVBAYTAkVVMRUwEwYDVQQKDAx3d1dhbGxldC5vcmcxGzAZBgNVBAMM
EmxvY2FsLnd3d2FsbGV0Lm9yZzBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABFVi
vGt53M4qEP06QT20BSlGiMIdzLLvG+b9fq/fHKM+NGT+a3snXiPwU7X7jrOFWxwy
jZeean40+vx6Gy06VfqjggFHMIIBQzAdBgNVHQ4EFgQUM/A3FTQLjww5/9u01MX/
SRyVqaUwHwYDVR0jBBgwFoAU0HGu3T+/Wqh3yNifz9sNd+HPBS4wDgYDVR0PAQH/
BAQDAgeAMDIGA1UdEgQrMCmBEWluZm9Ad3d3YWxsZXQub3JnhhRodHRwczovL3d3
d2FsbGV0Lm9yZzASBgNVHSUECzAJBgcogYxdBQECMAwGA1UdEwEB/wQCMAAwRAYD
VR0fBD0wOzA5oDegNYYzaHR0cHM6Ly93d3dhbGxldC5vcmcvaWFjYS9jcmwvd3d3
YWxsZXRfb3JnX2lhY2EuY3JsMFUGA1UdEQROMEyCEmxvY2FsLnd3d2FsbGV0Lm9y
Z4IZbG9jYWwtaXNzdWVyLnd3d2FsbGV0Lm9yZ4IbbG9jYWwtdmVyaWZpZXIud3d3
YWxsZXQub3JnMAoGCCqGSM49BAMCA0gAMEUCIQCQ8h+5krhO+f4woReDY1D7CaM6
qCda3m814e6DLvOphAIgHQL+Wm7WFRwxgjzMLN37RojJGrZbF4OFChIkmm0uu5o=
-----END CERTIFICATE-----`;

function signer() {
	const privateKey = crypto.createPrivateKey(metadataPrivateKey);

	return async (input: string) => {
		const result = crypto.sign(null, Buffer.from(input), {
			dsaEncoding: "ieee-p1363",
			key: privateKey,
		});
		return Buffer.from(result).toString("base64url");
	};
}

function saltGenerator() {
	const buffer = crypto.randomBytes(16);
	return buffer.toString("base64url");
}
