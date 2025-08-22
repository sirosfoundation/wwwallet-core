/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			exclude: [
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
