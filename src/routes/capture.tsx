import { createFileRoute } from "@tanstack/react-router";

const CapturePlaceholder = () => {
	return (
		<main className="min-h-svh bg-primary-light px-6 py-8 md:px-16">
			<div className="inline-flex items-center gap-2.5 text-medium font-semibold tracking-[-0.03em] text-secondary">
				<img src="/favicon.svg" alt="" width="36" height="36" />
				<span>Annotarama</span>
			</div>
			<div className="mx-auto mt-[clamp(6.25rem,20vh,13.75rem)] max-w-3xl">
				<h1 className="m-0 text-heading-3 font-semibold leading-[1.05] tracking-[-0.04em] text-secondary text-balance sm:text-heading-2">
					Camera tools are in progress.
				</h1>
			</div>
		</main>
	);
};

export const Route = createFileRoute("/capture")({
	component: CapturePlaceholder,
});
