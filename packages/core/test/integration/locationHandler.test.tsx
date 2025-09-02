import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

const LocationHandler = () => {
	return <a href="/">test</a>;
};

describe("location handler", () => {
	it("test", () => {
		render(<LocationHandler />);

		expect(screen.getByText("test")).to.eq("");
	});
});
