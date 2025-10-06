/// <reference types="vitest/config" />

import react from "@vitejs/plugin-react";
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
				plugins: [react()],
				extends: true,
				test: {
					include: ["test/**/*.test.tsx"],
					name: { label: "jsdom", color: "blue" },
					globals: true,
					environment: "jsdom",
				},
			},
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
