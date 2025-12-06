type OauthErrorStatus = 400 | 401 | 404 | 500;

export type OauthErrorResponse = {
	status: OauthErrorStatus;
	data: {
		error: OauthError;
		errorMessage: string;
		[key: string]: unknown;
	};
	body: {
		error: string;
		error_description: string;
	};
};

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

	toResponse(data: { [key: string]: unknown } = {}): OauthErrorResponse {
		return {
			status: this.status,
			data: {
				error: this,
				errorMessage: this.error_description,
				...this.data,
				...data,
			},
			body: {
				error: this.error,
				error_description: this.error_description,
			},
		};
	}
}
