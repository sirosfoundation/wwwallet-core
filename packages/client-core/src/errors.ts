export class OauthError extends Error {
	error: string;
	error_description: string;
	data: {
		error: Error;
		[key: string]: unknown;
	};

	constructor(
		error: string,
		error_description: string,
		data: { [key: string]: unknown } = {},
	) {
		super(`\"${error_description}\"`);

		this.error = error;
		this.error_description = error_description;
		this.data = Object.assign({ error: this }, data);
	}

	toResponse(data: { [key: string]: unknown } = {}) {
		Object.assign(this.data, data);
		return this;
	}
}
