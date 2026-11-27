import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SegmentedToggleOption = {
	value: string;
	label: string;
	icon?: ReactNode;
};

type SegmentedToggleProps = {
	ariaLabel: string;
	options: readonly [SegmentedToggleOption, SegmentedToggleOption];
	value: string;
	onValueChange: (value: string) => void;
	className?: string;
};

export const SegmentedToggle = ({
	ariaLabel,
	options,
	value,
	onValueChange,
	className,
}: SegmentedToggleProps) => (
	<fieldset
		className={cn(
			"relative m-0 inline-grid shrink-0 grid-cols-2 rounded-md border-0 bg-surface-muted p-0.5",
			className,
		)}
	>
		<legend className="sr-only">{ariaLabel}</legend>
		<span
			aria-hidden="true"
			className={cn(
				"pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%_-_0.125rem)] rounded bg-surface shadow-sm ring-1 ring-border/50 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
				value === options[1].value ? "translate-x-full" : "translate-x-0",
			)}
		/>
		{options.map((option) => {
			const isSelected = value === option.value;

			return (
				<button
					key={option.value}
					type="button"
					aria-pressed={isSelected}
					onClick={() => onValueChange(option.value)}
					className={cn(
						"relative inline-flex min-h-8 cursor-pointer items-center justify-center gap-1 rounded px-2 text-xs font-medium transition-colors duration-200 focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-accent motion-reduce:transition-none",
						isSelected
							? "text-primary"
							: "text-neutral-dark hover:text-secondary",
					)}
				>
					{option.icon}
					{option.label}
				</button>
			);
		})}
	</fieldset>
);
