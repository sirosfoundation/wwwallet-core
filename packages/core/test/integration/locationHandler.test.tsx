import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

const LocationHandler = () => {
	return <a href="/">test</a>;
};

describe("location handler", () => {
	it("test", () => {
		render(<LocationHandler />);

		const link = screen.getByText("test") as HTMLAnchorElement;
		expect(link.getAttribute("href")).to.equal("/");
	});
});
