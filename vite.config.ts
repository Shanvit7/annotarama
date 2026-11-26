import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const basePath = process.env.VITE_BASE_PATH || "/";
const routerBasePath = basePath.replace(/\/$/, "") || "/";

const config = defineConfig({
	base: basePath,
	resolve: { tsconfigPaths: true },
	plugins: [
		tanstackStart({
			router: { basepath: routerBasePath },
			prerender: { enabled: true, crawlLinks: true },
		}),
		viteReact(),
		tailwindcss(),
	],
});

export default config;
