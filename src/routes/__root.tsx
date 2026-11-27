import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@yusufceng1z/ding-react";
import { useEffect } from "react";
import { AnnotationDeleteConfirmation } from "@/components/molecules/annotation-delete-confirmation";
import { APP_FAVICON_URL, APP_IS_DEVELOPMENT } from "@/lib/constants";
import {
	getOrCreatePhotoSessionId,
	startPhotoDraftCleanup,
} from "@/lib/photo-drafts";

import appCss from "@/styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Annotarama",
			},
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: APP_FAVICON_URL,
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

const PhotoDraftCleanup = () => {
	useEffect(() => {
		getOrCreatePhotoSessionId();
		return startPhotoDraftCleanup();
	}, []);
	return null;
};

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				{APP_IS_DEVELOPMENT && (
					<script type="module" src="/src/react-scan.ts" />
				)}
				<HeadContent />
			</head>
			<body>
				<PhotoDraftCleanup />
				{children}
				<AnnotationDeleteConfirmation />
				<Toaster position="top-center" theme="light" />
				<Scripts />
			</body>
		</html>
	);
}
