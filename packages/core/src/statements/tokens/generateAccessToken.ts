import type { Logger, TokenGenerator } from "../../config";
import { OauthError } from "../../errors";
import type { OauthClient, OauthScope } from "../../resources";

export type GenerateAccessTokenParams = {
	authorization_code?: string;
	client: OauthClient;
	scope: OauthScope;
	sub?: string;
};

export type GenerateAccessTokenConfig = {
	databaseOperations: {
		generateToken: TokenGenerator;
	};
	logger: Logger;
	access_token_ttl: number;
};

export async function generateAccessToken(
	{
		authorization_code,
		client,
		sub: requestedSub,
		scope,
	}: GenerateAccessTokenParams,
	config: GenerateAccessTokenConfig,
) {
	const sub = requestedSub || client.id;

	try {
		const expires_in = config.access_token_ttl;
		const access_token = await config.databaseOperations.generateToken(
			"access_token",
			{
				previous_code: authorization_code,
				client_id: client.id,
				sub,
				scope,
			},
			expires_in,
		);

		return { access_token, expires_in };
	} catch (error) {
		config.logger.error((error as Error).message);

		throw new OauthError(
			500,
			"unknown_error",
			"could not generate access token",
		);
	}
}
