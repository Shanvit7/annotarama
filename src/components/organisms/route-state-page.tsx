import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { APP_FAVICON_URL, SUPPORT_EMAIL } from "@/lib/constants";
import { logger } from "@/lib/logger";

type RouteStatePageProps = {
	code: string;
	title: string;
	description: ReactNode;
	children: ReactNode;
};

const RouteStatePage = ({
	code,
	title,
	description,
	children,
}: RouteStatePageProps) => (
	<main className="grid min-h-svh place-items-center bg-linear-to-br from-frost via-primary-light to-surface px-5 py-8 sm:px-8">
		<section className="w-full max-w-2xl rounded-large border border-white/70 bg-surface/90 p-6 shadow-md shadow-secondary/10 backdrop-blur-xl sm:p-10">
			<Link
				to="/"
				aria-label="Annotarama home"
				className="inline-flex min-h-11 items-center gap-2.5 rounded-xl text-medium font-semibold tracking-[-0.03em] text-secondary"
			>
				<img src={APP_FAVICON_URL} alt="" width="36" height="36" />
				<span>Annotarama</span>
			</Link>

			<div className="mt-12">
				<p
					className={
						code === "404"
							? "text-heading-1 font-semibold leading-none tracking-[-0.08em] text-primary"
							: "text-small font-semibold tracking-[0.12em] text-primary"
					}
				>
					{code}
				</p>
				<h1 className="mt-3 text-heading-4 font-semibold leading-[1.05] tracking-[-0.04em] text-secondary text-balance sm:text-heading-3">
					{title}
				</h1>
				<p className="mt-4 max-w-prose text-regular leading-relaxed text-neutral-dark">
					{description}
				</p>
			</div>

			<div className="mt-8 flex flex-wrap gap-3">{children}</div>
		</section>
	</main>
);

export const RoutePendingPage = () => (
	<main className="grid min-h-svh place-items-center bg-surface">
		<output className="flex items-center gap-3 text-sm font-medium text-secondary">
			<LoaderCircle
				aria-hidden="true"
				className="size-5 animate-spin text-primary motion-reduce:animate-none"
			/>
			<span>Loading page…</span>
		</output>
	</main>
);

export const RouteNotFoundPage = () => (
	<RouteStatePage
		code="404"
		title="Page not found."
		description="We couldn’t find that page. Check the address or return to Annotarama."
	>
		<Link
			to="/"
			className="inline-flex min-h-11 items-center font-semibold text-primary underline decoration-accent underline-offset-4 transition-colors hover:text-primary-hover motion-reduce:transition-none"
		>
			Return to Annotarama
		</Link>
	</RouteStatePage>
);

export const RouteErrorPage = ({ error, reset }: ErrorComponentProps) => {
	useEffect(() => {
		logger.error("Route error", error);
	}, [error]);

	return (
		<RouteStatePage
			code="Error"
			title="We couldn’t load this page."
			description={
				<>
					Sorry about this. We’ve notified our team, and they’re looking into
					it. If the problem continues, email us at{" "}
					<a
						href={`mailto:${SUPPORT_EMAIL}`}
						className="font-semibold text-primary underline decoration-accent underline-offset-4 transition-colors hover:text-primary-hover motion-reduce:transition-none"
					>
						{SUPPORT_EMAIL}
					</a>
					, and we’ll look into it.
				</>
			}
		>
			<button
				type="button"
				className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-primary px-6 font-semibold text-surface transition-colors duration-200 hover:bg-primary-hover motion-reduce:transition-none"
				onClick={reset}
			>
				Try again
			</button>
			<Link
				to="/"
				className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 font-semibold text-secondary transition-colors duration-200 hover:bg-primary-light motion-reduce:transition-none"
			>
				Go to homepage
			</Link>
		</RouteStatePage>
	);
};
