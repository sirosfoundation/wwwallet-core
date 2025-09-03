import { render, screen, waitFor } from "@testing-library/react";
// biome-ignore lint/correctness/noUnusedImports: required by tsx files
import React, { useState } from "react";
import { assert, describe, expect, it, vi } from "vitest";
import { Core, type IssuerMetadata } from "../../src";
import { OauthError } from "../../src/errors";

const core = new Core({});

type PushedAuthorizationRequestMetadata = {
	issuer_state: string;
	issuer_metadata: IssuerMetadata;
};

const LocationHandler = () => {
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<OauthError | null>(null);
	const [protocol, setProtocol] = useState<string | null>(null);
	const [nextStep, setNextStep] = useState<string | undefined>(undefined);
	const [data, setData] = useState<
		PushedAuthorizationRequestMetadata | undefined
	>(undefined);

	(async () => {
		return core
			.location(window.location)
			.then(({ protocol, nextStep, data }) => {
				setSuccess(true);
				setProtocol(protocol);
				setNextStep(nextStep);
				setData(data);
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
					{data && <p data-testid="issuerState">{data.issuer_state}</p>}
				</div>
			)}
		</div>
	);
};

describe.skip("location handler - integration", () => {
	it("returns", () => {
		render(<LocationHandler />);

		return waitFor(() => {
			const success = screen.getByTestId("success") as HTMLAnchorElement;
			assert(success);
			expect(success.innerHTML).to.eq("");
		});
	});

	it("returns an error with an invalid credential offer", () => {
		vi.stubGlobal("location", {
			search: "?credential_offer=invalid",
		});
		render(<LocationHandler />);

		return waitFor(() => {
			const error = screen.getByTestId("error") as HTMLAnchorElement;
			assert(error);
			expect(error.innerHTML).to.eq("credential offer could not be parsed");
		});
	});

	it("renders with a valid authorization code grants (issuer_state)", () => {
		const credential_issuer = "https://demo-issuer.wwwallet.org/";
		const credential_configuration_ids = ["credential_configuration_ids"];
		const issuer_state = "issuer_state";
		const grants = { authorization_code: { issuer_state } };
		const credential_offer = {
			credential_issuer,
			credential_configuration_ids,
			grants,
		};
		vi.stubGlobal("location", {
			search: `?credential_offer=${JSON.stringify(credential_offer)}`,
		});
		render(<LocationHandler />);

		return waitFor(() => {
			screen.getByTestId("success") as HTMLAnchorElement;

			const protocol = screen.getByTestId("protocol") as HTMLAnchorElement;
			expect(protocol.innerHTML).to.eq("oid4vci");

			const nextStep = screen.getByTestId("nextStep") as HTMLAnchorElement;
			expect(nextStep.innerHTML).to.eq("pushed_authorization_request");

			const issuerState = screen.getByTestId(
				"issuerState",
			) as HTMLAnchorElement;
			expect(issuerState.innerHTML).to.eq(issuer_state);
		});
	});
});
