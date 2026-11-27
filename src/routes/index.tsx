import { createFileRoute } from "@tanstack/react-router";
import { SlideArrowLink } from "@/components/atoms/slide-arrow-link";
import { InspectionAnatomy } from "@/components/inspection-anatomy";
import { APP_FAVICON_URL } from "@/lib/constants";

const Home = () => {
	return (
		<div className="min-h-svh bg-linear-to-br from-frost via-primary-light to-surface">
			<header className="absolute left-4 top-4 z-10 sm:left-12 sm:top-6">
				<div className="inline-flex min-h-12 items-center rounded-2xl border border-white/50 bg-white/25 px-3 shadow-md shadow-secondary/10 backdrop-blur-xl">
					<div className="inline-flex items-center gap-2 text-regular font-semibold tracking-[-0.02em] text-secondary">
						<img src={APP_FAVICON_URL} alt="" width="28" height="28" />
						<span>Annotarama</span>
					</div>
				</div>
			</header>

			<main>
				<section
					className="mx-auto grid min-h-svh w-full max-w-screen-2xl grid-cols-1 content-center items-center gap-8 px-5 py-11 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 lg:px-12 lg:py-9 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-12 xl:px-12 xl:py-16"
					aria-labelledby="hero-title"
				>
					<div className="text-primary lg:pl-8 xl:pl-12">
						<h1
							className="m-0 text-[length:clamp(2.5rem,11vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-balance lg:text-heading-3 xl:text-heading-2"
							id="hero-title"
						>
							<span className="bg-[linear-gradient(180deg,var(--color-primary),var(--color-indigo-dark)_61%,var(--color-indigo-darker))] bg-clip-text text-transparent [-webkit-text-fill-color:transparent] block">
								Mark what
							</span>
							<span className="inline-block [background-image:linear-gradient(var(--color-accent),var(--color-accent))] [background-position:left_bottom] bg-no-repeat [background-size:100%_0%] animate-[hero-highlight-paint_900ms_cubic-bezier(0.16,1,0.3,1)_350ms_forwards] motion-reduce:[animation-delay:0ms] px-[0.1em] py-[0.02em] text-ink italic [box-decoration-break:clone]">
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
