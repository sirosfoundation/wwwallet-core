import fs from "node:fs";
import path from "node:path";
import type { AuthorizationServerState, Config } from "@wwwallet/core";
import { merge } from "ts-deepmerge";
import { parse } from "yaml";
import { Logger } from "./logger";

const logger = new Logger("info");

const configPath = process.env.CONFIGURATION_PATH || "./config.yml";

const ymlConfig = parse(
	fs.readFileSync(path.join(__dirname, configPath)).toString(),
) as Config;

const baseConfig = {
	logger: logger,
	databaseOperations: {
		async insertAuthorizationServerState(
			authorizationServerState: AuthorizationServerState,
		) {
			logger.debug("insertAuthorizationServerState not implemented");
			return authorizationServerState;
		},
		async resourceOwnerData(sub: string, vct: string) {
			return { sub, vct };
		},
	},
	supported_credential_configuration_paths: [],
	supported_credential_configurations: [],
};

const config = merge(baseConfig, ymlConfig) as Config;

config.supported_credential_configurations =
	config.supported_credential_configurations?.concat(
		config.supported_credential_configuration_paths?.map(
			(credentialConfigurationPath) => {
				const credential = fs
					.readFileSync(path.join(__dirname, credentialConfigurationPath))
					.toString();

				return JSON.parse(credential);
			},
		) || [],
	);

export { config };
