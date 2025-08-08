import type { CredentialOfferHandlerConfig } from "../handlers";
import type { IssuerClient } from "../resources";

export async function issuerClient(
	config: CredentialOfferHandlerConfig,
): Promise<{ client: IssuerClient }> {
	return { client: config.issuer_client };
}
