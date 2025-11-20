import fs from "node:fs";
import path from "node:path";
import type { Config } from "@wwwallet/server-core";
import { merge } from "ts-deepmerge";
import { parse } from "yaml";
import { Logger } from "./logger";

const logger = new Logger("info");

const configPath = process.env.CONFIGURATION_PATH || "./config.yml";

const ymlConfig = parse(
	fs.readFileSync(path.join(process.cwd(), configPath)).toString(),
) as Config;

const baseConfig = {
	logger: logger,
	dataOperations: {
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
