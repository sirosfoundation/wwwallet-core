import { render, screen, waitFor } from "@testing-library/react";
// biome-ignore lint/correctness/noUnusedImports: required by tsx files
import React, { useState } from "react";
import { assert, describe, expect, it } from "vitest";
import { Core } from "../../src";
import { OauthError } from "../../src/errors";
import { fetchIssuerMetadataMock } from "../support/client";

const issuer = "http://issuer.url";
const issuer_state = "issuer_state";
const config = {
	wallet_url: "http://wallet.url",
	httpClient: {
		post: async (url: string) => {
			return { data: { request_uri: url } };
		},
		get: fetchIssuerMetadataMock({
			issuer,
			authorization_endpoint: new URL("/authorize", issuer).toString(),
			pushed_authorization_request_endpoint: new URL("/par", issuer).toString(),
		}),
	},
	static_clients: [
		{
			client_id: "id",
			issuer,
			pushed_authorization_request_endpoint: new URL("/par", issuer).toString(),
			authorize_endpoint: new URL("/authorize", issuer).toString(),
			scope: "scope",
		},
	],
};

// @ts-ignore
const core = new Core(config);

const AuthorizationHandler = (props: {
	issuer: string;
	issuer_state: string;
}) => {
	const [success, setSuccess] = useState(false);
	const [authorizeUrl, setAuthorizeUrl] = useState<string | null>(null);
	const [protocol, setProtocol] = useState<string | null>(null);
	const [nextStep, setNextStep] = useState<string | null>(null);
	const [error, setError] = useState<OauthError | null>(null);

	(async () => {
		return core
			.authorization({
				issuer: props.issuer,
				issuer_state: props.issuer_state,
			})
			.then((response) => {
				setSuccess(true);
				setProtocol(response.protocol);
				setNextStep(response.nextStep);
				setAuthorizeUrl(response.data.authorize_url);
			})
			.catch((error) => {
				if (error instanceof OauthError) {
					return setError(error);
				}
				console.log(error);
			});
	})();

	return (
		<div>
			{error && <div data-testid="error">{error.error_description}</div>}
			{success && (
				<div data-testid="success">
					{protocol && <p data-testid="protocol">{protocol}</p>}
					{nextStep && <p data-testid="nextStep">{nextStep}</p>}
					{authorizeUrl && <p data-testid="authorizeUrl">{authorizeUrl}</p>}
				</div>
			)}
		</div>
	);
};

describe("authorization handler - integration", () => {
	it("returns an error with an invalid issuer", () => {
		const issuer = "http://issuer.other";
		render(
			<AuthorizationHandler issuer={issuer} issuer_state={issuer_state} />,
		);

		return waitFor(() => {
			const error = screen.getByTestId("error") as HTMLAnchorElement;
			assert(error);
			expect(error.innerHTML).to.eq("could not find issuer client");
		});
	});

	it("renders", () => {
		render(
			<AuthorizationHandler issuer={issuer} issuer_state={issuer_state} />,
		);

		return waitFor(() => {
			screen.getByTestId("success") as HTMLAnchorElement;

			const protocol = screen.getByTestId("protocol") as HTMLAnchorElement;
			expect(protocol.innerHTML).to.eq("oid4vci");

			const nextStep = screen.getByTestId("nextStep") as HTMLAnchorElement;
			expect(nextStep.innerHTML).to.eq("authorize");

			const authorizeUrl = screen.getByTestId(
				"authorizeUrl",
			) as HTMLAnchorElement;
			expect(authorizeUrl.innerHTML).to.eq(
				"http://issuer.url/authorize?client_id=id&amp;request_uri=http%3A%2F%2Fissuer.url%2Fpar",
			);
		});
	});
});
