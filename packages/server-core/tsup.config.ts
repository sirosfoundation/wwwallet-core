import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	tsconfig: "./tsconfig.json",
	target: "node22",
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
});
