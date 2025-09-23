type ErrorType =
	| "invalid_location"
	| "invalid_request"
	| "invalid_issuer"
	| "invalid_client"
	| "invalid_parameters";

export class OauthError extends Error {
	error: ErrorType;
	error_description: string;
	data: { [key: string]: unknown };

	constructor(
		error: ErrorType,
		error_description: string,
		data: { [key: string]: unknown } = {},
	) {
		super(`\"${error_description}\"`);

		this.error = error;
		this.error_description = error_description;
		this.data = data;
	}

	toResponse(data: { [key: string]: unknown } = {}) {
		Object.assign(this.data, data);
		return this;
	}
}
