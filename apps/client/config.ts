import fs from "node:fs";
import path from "node:path";
import {
	type Config,
	type EncryptConfig,
	secretDerivation,
} from "@wwwallet/server-core";
import { EncryptJWT } from "jose";
import { merge } from "ts-deepmerge";
import { parse } from "yaml";
import { Logger } from "./logger";

const logger = new Logger("info");

const configPath = process.env.CONFIGURATION_PATH || "./config.yml";

const ymlConfig = parse(
	fs.readFileSync(path.join(process.cwd(), configPath)).toString(),
) as Config;

const deferred_credentials_path = "./deferred_credentials";

const baseConfig = {
	logger: logger,
	dataOperations: {
		async deferredResourceOwnerData(
			sub: string,
			vct: string,
			config: EncryptConfig,
		) {
			const data = { sub, vct };

			const secret = new TextEncoder().encode(config.secret);
			const encryptedData = await new EncryptJWT(data)
				.setProtectedHeader({ alg: "dir", enc: config.token_encryption })
				.setIssuedAt()
				.encrypt(secret);
			const transaction_id = await secretDerivation(
				JSON.stringify(data),
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
		async resourceOwnerData(sub: string, vct: string) {
			return { sub, vct };
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
			(credentialConfigurationPath) => {
				const credential = fs
					.readFileSync(path.join(process.cwd(), credentialConfigurationPath))
					.toString();

				return JSON.parse(credential);
			},
		) || [],
	);

config.trusted_root_certificates = config.trusted_root_certificates?.concat(
	config.trusted_root_certificate_paths?.map((certificatePath) => {
		return fs
			.readFileSync(path.join(process.cwd(), certificatePath))
			.toString();
	}) || [],
);

export { config };
