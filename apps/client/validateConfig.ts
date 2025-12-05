import { exit } from "node:process";
import {
	validateAuthorizeHandlerConfig,
	validateCredentialHandlerConfig,
	validateCredentialOfferHandlerConfig,
	validateNonceHandlerConfig,
	validateOauthAuthorizationServerHandlerConfig,
	validateOpenidCredentialIssuerHandlerConfig,
	validatePushedAuthorizationRequestHandlerConfig,
	validateTokenHandlerConfig,
} from "@wwwallet/server-core";
import { protocols } from "./container";

setTimeout(() => {
	try {
		validateAuthorizeHandlerConfig(protocols.config);
		validateCredentialHandlerConfig(protocols.config);
		validateCredentialOfferHandlerConfig(protocols.config);
		validateNonceHandlerConfig(protocols.config);
		validateOauthAuthorizationServerHandlerConfig(protocols.config);
		validateOpenidCredentialIssuerHandlerConfig(protocols.config);
		validatePushedAuthorizationRequestHandlerConfig(protocols.config);
		validateTokenHandlerConfig(protocols.config);

		console.info(
			"    \x1b[32m%s\x1b[0m",
			"========== configuration validation",
		);
		console.info("        \x1b[32m[OK]\x1b[32m");
		console.info(
			"    \x1b[32m%s\x1b[0m",
			"===================================",
		);

		console.log("\n");

		exit(0);
	} catch (error) {
		console.error(
			"    \x1b[31m%s\x1b[0m",
			"========== configuration validation",
		);
		console.error(
			"        \x1b[31m[ERROR] %s\x1b[0m",
			(error as Error).message,
		);
		console.error(
			"    \x1b[31m%s\x1b[0m",
			"===================================",
		);

		console.log("\n");

		exit(1);
	}
}, 100);
