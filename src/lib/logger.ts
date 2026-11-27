const LOGGING_ENABLED =
	import.meta.env?.DEV || import.meta.env?.VITE_ENABLE_LOGS === "true";

export const logger = {
	log: (...args: unknown[]) => {
		if (LOGGING_ENABLED) console.log(...args);
	},
	info: (...args: unknown[]) => {
		if (LOGGING_ENABLED) console.info(...args);
	},
	warn: (...args: unknown[]) => {
		if (LOGGING_ENABLED) console.warn(...args);
	},
	error: (...args: unknown[]) => {
		console.error(...args);
	},
	debug: (...args: unknown[]) => {
		if (LOGGING_ENABLED) console.debug(...args);
	},
};
