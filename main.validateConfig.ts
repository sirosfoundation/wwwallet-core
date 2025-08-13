import { exit } from "node:process";
import { core } from "./main.container";
import {
	validateAuthorizeHandlerConfig,
	validateCredentialOfferHandlerConfig,
	validateOauthAuthorizationServerHandlerConfig,
	validateOpenidCredentialIssuerHandlerConfig,
	validatePushedAuthorizationRequestHandlerConfig,
	validateTokenHandlerConfig,
} from "./src";

try {
	validateAuthorizeHandlerConfig(core.config);
	validateCredentialOfferHandlerConfig(core.config);
	validateTokenHandlerConfig(core.config);
	validateOauthAuthorizationServerHandlerConfig(core.config);
	validateOpenidCredentialIssuerHandlerConfig(core.config);
	validatePushedAuthorizationRequestHandlerConfig(core.config);

	console.info("    \x1b[32m%s\x1b[0m", "========== configuration validation");
	console.info("        \x1b[32m[OK]\x1b[32m");
	console.info("    \x1b[32m%s\x1b[0m", "===================================");

	console.log("\n");
} catch (error) {
	console.error("    \x1b[31m%s\x1b[0m", "========== configuration validation");
	console.error("        \x1b[31m[ERROR] %s\x1b[0m", (error as Error).message);
	console.error("    \x1b[31m%s\x1b[0m", "===================================");

	console.log("\n");

	exit(1);
}
