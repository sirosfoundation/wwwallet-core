import { DcqlQuery } from "dcql";
import { OauthError } from "../../errors";

export type ValidateDcqlQueryParams = {
	dcql_query: unknown;
};

export type ValidateDcqlQueryConfig = {};

/**
 * Parses and validates an incoming DCQL query object.
 *
 * ### Why (Security)
 * Strict query parsing reduces query-confusion and unexpected credential disclosure behavior.
 *
 * ### Specifications
 * - DCQL, query grammar and semantics
 * - OpenID4VP with DCQL integration profile
 * - OpenID4VP query evaluation model
 */
export async function validateDcqlQuery(
	{ dcql_query }: ValidateDcqlQueryParams,
	_config: ValidateDcqlQueryConfig,
) {
	if (!dcql_query) {
		return { dcql_query: null };
	}

	try {
		const dcqlQuery = DcqlQuery.parse(dcql_query as DcqlQuery.Input);

		return { dcql_query: dcqlQuery };
	} catch (error) {
		throw new OauthError("invalid_query", "could not parse dcql query", {
			error,
		});
	}
}
