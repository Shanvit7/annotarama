export const TOAST_DURATION_MS = 5000;
export const SUPPORT_EMAIL = "shanvit7@gmail.com";
export const APP_IS_DEVELOPMENT = import.meta.env.DEV;
export const APP_REACT_SCAN_ENABLED =
	import.meta.env.VITE_REACT_SCAN === "true";
const APP_BASE_URL = import.meta.env.BASE_URL;
export const APP_BASE_PATH = APP_BASE_URL.replace(/\/$/, "") || "/";
export const APP_FAVICON_URL = `${APP_BASE_URL}favicon.svg`;
