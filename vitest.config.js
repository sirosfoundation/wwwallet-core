/// <reference types="vitest/config" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: [
			"packages/*",
			{
				plugins: [react()],
				extends: true,
				test: {
					include: ["test/**/*.test.tsx"],
					name: { label: "happy-dom", color: "blue" },
					globals: true,
					environment: "happy-dom",
				},
			},
			{
				extends: true,
				test: {
					include: ["test/**/*.test.ts"],
					// color of the name label can be changed
					name: { label: "node", color: "green" },
					environment: "node",
				},
			},
		],
		coverage: {
			exclude: [
				"packages/core/tsup.config.ts",
				"packages/core/dist/**",
				"apps/client/**",
				"scripts/**",
				"**/_*",
				"main.*",
				"**/*.old.ts",
				"vitest.config.js",
			],
		},
	},
});
