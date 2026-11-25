import { createFileRoute } from "@tanstack/react-router";
import { SlideArrowLink } from "../components/atoms/SlideArrowLink";
import { InspectionAnatomy } from "../components/inspection-anatomy";

const Home = () => {
	return (
		<div className="min-h-svh bg-linear-to-br from-frost via-primary-light to-surface">
			<header className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
				<div className="inline-flex min-h-14 items-center rounded-2xl border border-white/50 bg-white/25 px-4 shadow-md shadow-secondary/10 backdrop-blur-xl">
					<div className="inline-flex items-center gap-2.5 text-medium font-semibold tracking-[-0.03em] text-secondary">
						<img src="/favicon.svg" alt="" width="36" height="36" />
						<span>Annotarama</span>
					</div>
				</div>
			</header>

			<main>
				<section
					className="mx-auto grid min-h-svh w-full max-w-screen-2xl grid-cols-1 content-center items-center gap-8 px-5 py-11 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12 lg:px-9 lg:py-9 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:gap-12 xl:px-6 xl:py-16"
					aria-labelledby="hero-title"
				>
					<div className="text-primary">
						<h1
							className="m-0 text-[length:clamp(2.5rem,11vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-balance lg:text-heading-3 xl:text-heading-2"
							id="hero-title"
						>
							<span className="hero-title-gradient block">Mark what</span>
							<span className="hero-highlight inline-block px-[0.1em] py-[0.02em] text-ink italic [box-decoration-break:clone]">
								needs attention.
							</span>
						</h1>
						<SlideArrowLink className="mt-7 lg:mt-9" to="/capture" />
					</div>
					<InspectionAnatomy />
				</section>
			</main>
		</div>
	);
};

export const Route = createFileRoute("/")({ component: Home });
