import fs from "node:fs";
import path from "node:path";
import {
	type Config,
	type DecryptConfig,
	type DeferredCredential,
	type DeferredResourceOwnerData,
	type EncryptConfig,
	jwtDecryptWithConfigKeys,
	type ResourceOwnerData,
	type SupportedCredentialConfiguration,
	secretDerivation,
} from "@wwwallet/server-core";
import { EncryptJWT, type JWK } from "jose";
import { merge } from "ts-deepmerge";
import { parse } from "yaml";
import { Logger } from "./logger";

const logger = new Logger("info");

const configPath = process.env.CONFIGURATION_PATH || "./config.yml";

const ymlConfig = parse(
	fs.readFileSync(path.join(process.cwd(), configPath)).toString(),
) as Config;

const deferred_credentials_path = "./deferred_credentials";

type StoredResourceOwnerData = {
	defer_data: DeferredResourceOwnerData;
	commit: boolean;
};

const baseConfig = {
	logger: logger,
	dataOperations: {
		async deferredResourceOwnerData(
			defer_data: {
				sub: string;
				data: Array<ResourceOwnerData>;
				jwks: Array<JWK>;
			},
			config: EncryptConfig,
		) {
			const secret = new TextEncoder().encode(config.secret);
			const encryptedData = await new EncryptJWT({
				defer_data,
				commit: true,
			})
				.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
				.setIssuedAt()
				.encrypt(secret);
			const transaction_id = await secretDerivation(
				JSON.stringify({
					sub: defer_data.sub,
					credential_configurations: defer_data.data.map(
						({ credential_configuration }) => credential_configuration,
					),
				}),
				Date.now(),
			);

			fs.writeFileSync(
				path.join(
					process.cwd(),
					deferred_credentials_path,
					`${transaction_id}.jwe`,
				),
				encryptedData,
			);

			return { transaction_id };
		},
		async fetchDeferredResourceOwnerData(
			{ transaction_id }: DeferredCredential,
			config: DecryptConfig,
		) {
			const jwes = fs
				.readFileSync(
					path.join(
						process.cwd(),
						deferred_credentials_path,
						`${transaction_id}.jwe`,
					),
				)
				.toString()
				.split("\n");

			let jwe = jwes.shift();
			while (jwe) {
				const {
					payload: { defer_data: currentDeferData, commit: currentCommit },
				} = await jwtDecryptWithConfigKeys<StoredResourceOwnerData>(
					jwe,
					config,
				);

				if (currentCommit) {
					return currentDeferData;
				}
				jwe = jwes.shift();
			}

			return null;
		},
		async resourceOwnerData(
			{
				sub,
				credential_configurations,
				jwks,
			}: {
				sub: string;
				credential_configurations: Array<SupportedCredentialConfiguration>;
				jwks: Array<JWK>;
			},
			config: EncryptConfig,
		) {
			const data = credential_configurations.map((credential_configuration) => {
				return {
					claims: { sub, vct: credential_configuration.vct },
					credential_configuration,
				};
			});

			if (credential_configurations.some(({ deferred }) => deferred)) {
				return this.deferredResourceOwnerData(
					{
						sub,
						data,
						jwks,
					},
					config,
				);
			}

			return data;
		},
	},
	supported_credential_configuration_paths: [],
	supported_credential_configurations: [],
	trusted_root_certificates: [],
};

const config = merge(baseConfig, ymlConfig) as Config;

config.supported_credential_configurations =
	config.supported_credential_configurations?.concat(
		config.supported_credential_configuration_paths?.map(
			(credentialConfigurationPath: string) => {
				const credential = fs
					.readFileSync(path.join(process.cwd(), credentialConfigurationPath))
					.toString();

				return JSON.parse(credential);
			},
		) || [],
	);

config.trusted_root_certificates = config.trusted_root_certificates?.concat(
	config.trusted_root_certificate_paths?.map((certificatePath: string) => {
		return fs
			.readFileSync(path.join(process.cwd(), certificatePath))
			.toString();
	}) || [],
);

export { config };
