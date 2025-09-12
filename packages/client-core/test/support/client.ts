export const fetchIssuerMetadataMock = (issuerMetadata: unknown) => {
	return async <T>(url: string) => {
		if (url.match(/oauth-authorization-server/)) {
			return {
				data: issuerMetadata as T,
			};
		}
		if (url.match(/openid-credential-issuer/)) {
			return {
				data: {} as T,
			};
		}
		throw new Error("not found");
	};
};
