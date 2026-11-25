import { useId } from "react";
import { inspectionPart } from "./inspection-part";

export const InspectionAnatomy = () => {
	const id = useId();
	const annotation = (
		<path
			data-part="annotation"
			d={inspectionPart.mark}
			pathLength="1"
			fill="var(--color-primary)"
			fillOpacity=".08"
			stroke="var(--color-primary)"
			strokeWidth="3"
			className="animate-[inspection-annotation_5.5s_ease-in-out_infinite] motion-reduce:animate-none"
		/>
	);

	return (
		<figure
			className="-mx-4 m-0 mt-4 min-w-0 w-[calc(100%+2rem)] max-w-none rounded-small px-4 md:mx-auto md:mt-0 md:w-full md:max-w-5xl md:px-0 xl:mx-0 xl:max-w-none xl:justify-self-end"
			role="img"
			aria-label="An illustrative AI suggestion flags rim damage that may affect bearing fit and recommends replacing the housing and checking its mating surface."
		>
			<svg
				className="block h-auto w-full"
				viewBox="-40 0 940 540"
				aria-hidden="true"
			>
				<defs>
					<clipPath id={`${id}-bore`}>
						<path d={inspectionPart.aperture} />
					</clipPath>
					<clipPath id={`${id}-screen`}>
						<rect x="12" y="40" width="156" height="275" rx="13" />
					</clipPath>
					<linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
						<stop stopColor="var(--color-surface)" />
						<stop offset="1" stopColor="var(--color-indigo-lighter)" />
					</linearGradient>
				</defs>

				<ellipse
					cx="460"
					cy="434"
					rx="203"
					ry="48"
					fill="var(--color-secondary)"
					className="animate-[inspection-machine_5.5s_ease-out_infinite] motion-reduce:animate-none"
					opacity=".07"
				/>
				<ellipse
					cx="125"
					cy="470"
					rx="102"
					ry="22"
					fill="var(--color-secondary)"
					opacity=".06"
				/>
				{/* The phone enters before the machine part appears. */}
				<g transform="translate(190 0)">
					<g
						data-part="machine"
						className="animate-[inspection-machine_5.5s_ease-out_infinite] motion-reduce:animate-none"
					>
						<path
							d="M220 353 454 230 681 353 450 483Z"
							fill="var(--color-primary-light)"
							stroke="var(--color-indigo-lighter)"
						/>
						<path
							d="m220 353 230 130v5L220 358Zm230 130 231-130v5L450 488Z"
							fill="var(--color-indigo-lighter)"
						/>

						<g id={`${id}-part`}>
							{inspectionPart.solids.map((part) => (
								<g key={part.id} data-part={part.id} strokeLinejoin="round">
									<path
										d={part.fill}
										fill={
											part.tone === "dark"
												? "var(--color-neutral-dark)"
												: "var(--color-neutral-light)"
										}
									/>
									{part.shades.map(
										(d, shade) =>
											d && (
												<path
													key={d}
													d={d}
													fill={
														[
															"var(--color-neutral-dark)",
															"var(--color-neutral)",
															"var(--color-neutral-light)",
															"var(--color-neutral-lighter)",
														][shade]
													}
												/>
											),
									)}
									<path
										d={part.top}
										fill={
											part.tone === "dark"
												? "var(--color-neutral-dark)"
												: "var(--color-surface-muted)"
										}
									/>
									<path
										d={part.crease}
										fill="none"
										stroke="var(--color-neutral)"
										strokeWidth=".65"
									/>
									<path
										d={part.outline}
										fill="none"
										stroke="var(--color-neutral-dark)"
										strokeWidth=".85"
									/>
									{part.bevel && (
										<path
											d={part.bevel}
											fill="none"
											stroke="var(--color-surface)"
											strokeWidth=".65"
										/>
									)}
								</g>
							))}
							{/* Bore wall sits behind its machined opening, not on the top face. */}
							<path
								d={inspectionPart.aperture}
								fill="var(--color-neutral-darkest)"
							/>
							<g clipPath={`url(#${id}-bore)`}>
								<path
									d={inspectionPart.bore}
									fill="var(--color-neutral-dark)"
									stroke="var(--color-neutral)"
									strokeWidth="8"
								/>
							</g>
							<path
								d={inspectionPart.aperture}
								fill="none"
								stroke="var(--color-neutral)"
								strokeWidth="1.5"
							/>
							<path
								d={inspectionPart.crack}
								fill="none"
								stroke="var(--color-neutral-darkest)"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</g>
						{annotation}
						<g
							data-part="comment"
							className="hidden animate-[inspection-comment_5.5s_ease-out_infinite] motion-reduce:animate-none sm:block"
						>
							<path
								d="M358 180h210a8 8 0 0 1 8 8v64a8 8 0 0 1-8 8H384l-24 16 9-16h-11a8 8 0 0 1-8-8v-64a8 8 0 0 1 8-8Z"
								fill="var(--color-surface)"
								stroke="var(--color-primary)"
								strokeWidth="1.5"
							/>
							<text
								x="370"
								y="200"
								fill="var(--color-primary)"
								fontFamily="var(--font-sans)"
								fontSize="10"
								fontWeight="700"
							>
								AI SUGGESTION
							</text>
							<text
								x="370"
								y="220"
								fill="var(--color-secondary)"
								fontFamily="var(--font-sans)"
								fontSize="11"
							>
								Rim chip may affect bearing fit.
							</text>
							<text
								x="370"
								y="240"
								fill="var(--color-secondary)"
								fontFamily="var(--font-sans)"
								fontSize="11"
							>
								Replace housing; inspect seat.
							</text>
						</g>
						<g className="sm:hidden animate-[inspection-comment_5.5s_ease-out_infinite] motion-reduce:animate-none">
							<path
								d="M350 280 338 288"
								fill="none"
								stroke="var(--color-primary)"
								strokeWidth="3"
							/>
							<rect
								x="350"
								y="160"
								width="330"
								height="166"
								rx="10"
								fill="var(--color-surface)"
								stroke="var(--color-primary)"
								strokeWidth="2"
							/>
							<text
								x="368"
								y="188"
								fill="var(--color-primary)"
								fontFamily="var(--font-sans)"
								fontSize="24"
								fontWeight="700"
							>
								AI SUGGESTION · DEMO
							</text>
							<text
								x="368"
								y="218"
								fill="var(--color-secondary)"
								fontFamily="var(--font-sans)"
								fontSize="28"
							>
								Rim chip may affect
							</text>
							<text
								x="368"
								y="248"
								fill="var(--color-secondary)"
								fontFamily="var(--font-sans)"
								fontSize="28"
							>
								bearing fit.
							</text>
							<text
								x="368"
								y="278"
								fill="var(--color-secondary)"
								fontFamily="var(--font-sans)"
								fontSize="28"
							>
								Replace housing;
							</text>
							<text
								x="368"
								y="308"
								fill="var(--color-secondary)"
								fontFamily="var(--font-sans)"
								fontSize="28"
							>
								inspect seat.
							</text>
						</g>
					</g>
				</g>

				<PhonePreview id={id} annotation={annotation} />
			</svg>
		</figure>
	);
};

type PhonePreviewProps = { id: string; annotation: React.ReactNode };

const PhonePreview = ({ id, annotation }: PhonePreviewProps) => (
	<g
		data-part="phone"
		className="animate-[inspection-phone_5.5s_ease-out_infinite] motion-reduce:animate-none"
	>
		<g transform="matrix(.98 .16 -.16 .98 30 54)">
			<path
				d="M20 0h142q20 0 20 20v324q0 20-20 20H20Q0 364 0 344V20Q0 0 20 0Z"
				fill="var(--color-indigo-dark)"
				stroke="var(--color-secondary)"
				strokeWidth="2"
				transform="translate(6 5)"
			/>
			<rect
				width="180"
				height="364"
				rx="23"
				fill="var(--color-secondary)"
				stroke="var(--color-indigo-light)"
				strokeWidth="1.5"
			/>
			<rect
				x="5"
				y="5"
				width="170"
				height="354"
				rx="20"
				fill="none"
				stroke="var(--color-indigo-dark)"
			/>
			<rect
				x="-3"
				y="65"
				width="3"
				height="27"
				rx="1"
				fill="var(--color-indigo-dark)"
			/>
			<rect
				x="-3"
				y="105"
				width="3"
				height="41"
				rx="1"
				fill="var(--color-indigo-dark)"
			/>
			<rect
				x="180"
				y="95"
				width="4"
				height="39"
				rx="1"
				fill="var(--color-indigo-light)"
			/>
			<rect
				x="12"
				y="40"
				width="156"
				height="275"
				rx="13"
				fill={`url(#${id}-glass)`}
			/>
			<g clipPath={`url(#${id}-screen)`}>
				<g className="animate-[inspection-preview_5.5s_ease-out_infinite] motion-reduce:animate-none">
					<g transform="translate(-18 35) scale(.4)">
						<use href={`#${id}-part`} />
						{annotation}
					</g>
				</g>
				<g
					data-part="scan"
					className="animate-[inspection-scan_5.5s_ease-in-out_infinite] motion-reduce:hidden"
				>
					<path
						d="M18 105h144v18H18Z"
						fill="var(--color-accent)"
						opacity=".18"
					/>
					<path
						d="M18 123h144"
						stroke="var(--color-primary)"
						strokeWidth="1.5"
					/>
				</g>
			</g>
			{/* Camera framing, lens, shutter ring, and home indicator. */}
			<path
				d="M28 122v-13h13m98 0h13v13M28 232v13h13m98 0h13v-13"
				fill="none"
				stroke="var(--color-primary)"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<rect
				x="67"
				y="17"
				width="35"
				height="4"
				rx="2"
				fill="var(--color-indigo-light)"
			/>
			<circle cx="113" cy="19" r="3" fill="var(--color-indigo-light)" />
			<circle cx="113" cy="19" r="1.4" fill="var(--color-sky)" />
			<circle
				cx="90"
				cy="335"
				r="13"
				fill="none"
				stroke="var(--color-surface)"
				strokeWidth="1.5"
			/>
			<circle cx="90" cy="335" r="9" fill="var(--color-surface)" />
			<rect
				x="65"
				y="352"
				width="50"
				height="2.5"
				rx="1.25"
				fill="var(--color-indigo-light)"
			/>
		</g>
	</g>
);
