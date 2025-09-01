export const logger = {
	business: (event: string, data: { [key: string]: string | undefined }) =>
		console.info(`${event} - `, JSON.stringify(data)),
	error: console.error,
	info: console.info,
	warn: console.warn,
	debug: console.debug,
};
