import type { Logger as CoreLogger } from "@wwwallet-private/server-core";
export type LogLevel = "error" | "info" | "warn" | "debug";

export class Logger implements CoreLogger {
	level: LogLevel;
	logLevels: Array<LogLevel> = ["error", "info", "warn", "debug"];

	constructor(level: LogLevel = "info") {
		this.level = level;
	}

	business(event: string, data: { [key: string]: string | undefined }) {
		this.info(
			`${event} - ` +
				Object.keys(data)
					.map((key: string) => `${key}=${data[key]}`)
					.join(" "),
		);
	}

	error(message: string) {
		if (this.logLevels.indexOf("error") > this.logLevels.indexOf(this.level))
			return;

		console.error(this.logPrefix(), message);
	}

	info(message: string) {
		if (this.logLevels.indexOf("info") > this.logLevels.indexOf(this.level))
			return;

		console.info(this.logPrefix(), message);
	}

	warn(message: string) {
		if (this.logLevels.indexOf("warn") > this.logLevels.indexOf(this.level))
			return;

		console.warn(this.logPrefix(), message);
	}

	debug(message: string) {
		if (this.logLevels.indexOf("debug") > this.logLevels.indexOf(this.level))
			return;

		console.log(this.logPrefix(), message);
	}

	logPrefix() {
		return `[wwwallet-issuer-poc] ${new Date().toISOString()} | `;
	}
}
