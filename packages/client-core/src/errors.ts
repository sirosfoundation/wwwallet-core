type OauthErrorStatus = 400 | 401 | 404;

export class OauthError extends Error {
	error: string;
	error_description: string;
	status: OauthErrorStatus;
	data: { [key: string]: unknown };

	constructor(
		status: OauthErrorStatus,
		error: string,
		error_description: string,
		data: { [key: string]: unknown } = {},
	) {
		super(`\"${error_description}\"`);

		this.status = status;
		this.error = error;
		this.error_description = error_description;
		this.data = data;
	}

	toResponse(data: { [key: string]: unknown } = {}) {
		Object.assign(this.data, data);
		return this;
	}
}
