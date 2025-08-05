import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../support/app";

describe("credential offer endpoint", () => {
	it("returns an error with a bad scope", async () => {
		const scope = "bad:scope";
		const response = await request(app).get(`/offer/${scope}`);

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "bad_request",
			error_description: "Invalid scope",
		});
	});

	[
		"eu.europa.ec.eudi.pid.1",
		"urn:credential:diploma",
		"urn:eu.europa.ec.eudi:pid:1:dc",
		"urn:eu.europa.ec.eudi:pid:1:vc",
		"urn:eu.europa.ec.eudi:por:1",
		"urn:eudi:ehic:1",
		"urn:eudi:pid:1:dc",
		"urn:eudi:pid:1:dc:jpt",
		"urn:eudi:pid:1:vc",
	].forEach((scope) => {
		it("returns", async () => {
			const response = await request(app).get(`/offer/${scope}`);

			expect(response.status).toBe(200);
			expect(response.body).to.deep.eq({});
		});
	});
});
