import { DcqlQuery } from "dcql";
import { OauthError } from "../../errors";

export type ValidateDcqlQueryParams = {
	dcql_query: unknown;
};

export type ValidateDcqlQueryConfig = {};

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
		throw new OauthError("invalid_location", "could not parse dcql query", {
			error,
		});
	}
}
