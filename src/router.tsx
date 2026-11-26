import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import {
	RouteErrorPage,
	RouteNotFoundPage,
} from "@/components/organisms/route-state-page";
import { APP_BASE_PATH } from "@/lib/constants";
import { routeTree } from "@/routeTree.gen";

export function getRouter() {
	const router = createTanStackRouter({
		basepath: APP_BASE_PATH,
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		defaultErrorComponent: RouteErrorPage,
		defaultNotFoundComponent: RouteNotFoundPage,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
