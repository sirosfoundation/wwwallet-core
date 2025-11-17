import type {
	ClientStateStore,
	HttpClient,
	PresentationCredentialsStore,
	VpTokenSigner,
} from "./ports";
import type { OauthClient } from "./resources";

export type Config = {
	httpClient?: HttpClient;
	clientStateStore?: ClientStateStore;
	presentationCredentialsStore?: PresentationCredentialsStore;
	vpTokenSigner?: VpTokenSigner;
	static_clients?: Array<OauthClient>;
	wallet_url?: string;
	wallet_callback_url?: string;
	dpop_ttl_seconds?: number;
};
