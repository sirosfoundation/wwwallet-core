import type { Config } from "../core";
import type { IssuerClient } from "../resources";

export async function issuerClient(
	config: Config,
): Promise<{ client: IssuerClient }> {
	return { client: config.issuer_client };
}
