import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

type SlideArrowLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
	text?: string;
};

export const SlideArrowLink = ({
	text = "Get started",
	className = "",
	...props
}: SlideArrowLinkProps) => (
	<Link
		className={`group/slide relative inline-flex h-12 items-center rounded-full border border-white bg-surface p-1 text-xl font-semibold text-secondary ${className}`}
		{...props}
	>
		<span className="absolute left-0.5 top-0.5 flex h-11 w-11 items-center justify-end rounded-full bg-primary transition-[width] duration-200 ease-in-out group-hover/slide:w-full group-focus-visible/slide:w-full motion-reduce:transition-none">
			<svg
				className="mr-3 size-5 shrink-0 text-surface"
				aria-hidden="true"
				viewBox="0 0 20 20"
				fill="none"
			>
				<path
					d="M4 10h11m-4-4 4 4-4 4"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</span>
		<span className="relative z-10 ml-2 translate-x-3 whitespace-nowrap px-8 font-semibold text-ink transition-[transform,color] duration-200 ease-in-out group-hover/slide:-translate-x-2 group-hover/slide:text-surface group-focus-visible/slide:-translate-x-2 group-focus-visible/slide:text-surface motion-reduce:transition-none">
			{text}
		</span>
	</Link>
);
