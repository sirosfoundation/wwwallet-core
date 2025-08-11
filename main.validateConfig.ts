import { core } from "./main.container";
import {
	validateCredentialOfferHandlerConfig,
	validateOauthAuthorizationServerHandlerConfig,
	validateOpenidCredentialIssuerHandlerConfig,
	validateTokenHandlerConfig,
} from "./src";

validateCredentialOfferHandlerConfig(core.config);
validateTokenHandlerConfig(core.config);
validateOauthAuthorizationServerHandlerConfig(core.config);
validateOpenidCredentialIssuerHandlerConfig(core.config);
