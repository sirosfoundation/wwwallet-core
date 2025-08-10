import type { IssuerClient } from "../resources";

export type IssuerClientConfig = {
	issuer_client: {
		scopes: Array<string>;
	};
};

export async function issuerClient(
	config: IssuerClientConfig,
): Promise<{ client: IssuerClient }> {
	return { client: config.issuer_client };
}
