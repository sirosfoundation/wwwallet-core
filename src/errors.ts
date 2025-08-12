type OauthErrorStatus = 400 | 401 | 404;

export type OauthErrorResponse = {
	status: OauthErrorStatus;
	data: {
		error: OauthError;
		errorMessage: string;
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

	constructor(
		status: OauthErrorStatus,
		error: string,
		error_description: string,
	) {
		super(error_description);

		this.status = status;
		this.error = error;
		this.error_description = error_description;
	}

	toResponse() {
		return {
			status: this.status,
			data: {
				error: this,
				errorMessage: this.error_description,
			},
			body: {
				error: this.error,
				error_description: this.error_description,
			},
		};
	}
}
