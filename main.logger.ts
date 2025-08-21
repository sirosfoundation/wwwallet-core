import type { Logger as CoreLogger } from "@wwwallet/core";
export type LogLevel = "error" | "info" | "warn" | "debug";

export class Logger implements CoreLogger {
	level: LogLevel;
	logLevels: Array<LogLevel> = ["error", "info", "warn", "debug"];

	constructor(level: LogLevel = "info") {
		this.level = level;
	}

	error(message: string) {
		if (this.logLevels.indexOf("error") > this.logLevels.indexOf(this.level))
			return;

		console.error(message);
	}

	info(message: string) {
		if (this.logLevels.indexOf("info") > this.logLevels.indexOf(this.level))
			return;

		console.info(message);
	}

	warn(message: string) {
		if (this.logLevels.indexOf("warn") > this.logLevels.indexOf(this.level))
			return;

		console.warn(message);
	}

	debug(message: string) {
		if (this.logLevels.indexOf("debug") > this.logLevels.indexOf(this.level))
			return;

		console.log(message);
	}
}
