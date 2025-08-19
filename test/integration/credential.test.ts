import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../support/app";

describe("credential endpoint", () => {
	it("returns an error without body", async () => {
		const response = await request(app).post("/credential");

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description: "credential requests require a body",
		});
	});

	it("returns an error with an empty body", async () => {
		const response = await request(app).post("/credential").send({});

		expect(response.status).toBe(400);
		expect(response.body).to.deep.eq({
			error: "invalid_request",
			error_description:
				"credential configuration ids are missing from body parameters",
		});
	});

	it("returns empty credential list with unknown credential configuration id", async () => {
		const credential_configuration_id = "unknwown:configuration:id";
		const response = await request(app)
			.post("/credential")
			.send({ credential_configuration_id });

		expect(response.status).toBe(200);
		expect(response.body).to.deep.eq({
			credentials: [],
		});
	});

	it("returns empty credential list with unknown credential configuration ids", async () => {
		const credential_configuration_ids = ["unknwown:configuration:id"];
		const response = await request(app)
			.post("/credential")
			.send({ credential_configuration_ids });

		expect(response.status).toBe(200);
		expect(response.body).to.deep.eq({
			credentials: [],
		});
	});

	it.skip("returns credentials", async () => {
		const credential_configuration_id = "full";
		const response = await request(app)
			.post("/credential")
			.send({ credential_configuration_id });

		expect(response.status).toBe(200);
		expect(response.body).to.deep.eq({
			credentials: [{ credential: "" }],
		});
	});
});
