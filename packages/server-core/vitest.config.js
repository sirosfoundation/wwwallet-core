/// <reference types="vitest/config" />

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			exclude: [
				"tsup.config.ts",
				"vitest.config.js",
				"dist/**",
				"**/_handler.template.ts",
				"**/_handlerTemplateConfig.schema.ts",
				"**/_statementTemplate.ts",
			],
		},
		projects: [
			{
				extends: true,
				test: {
					include: ["test/**/*.test.ts"],
					name: { label: "node", color: "green" },
					environment: "node",
				},
			},
		],
	},
});
