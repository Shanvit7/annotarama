import { ChevronDown } from "lucide-react";
import {
	type ComponentPropsWithRef,
	type ReactNode,
	useId,
	useState,
} from "react";

type CollapsiblePanelProps = {
	label: ReactNode;
	actions?: ReactNode;
	collapsible?: boolean;
	defaultOpen?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	headingProps?: ComponentPropsWithRef<"h2"> &
		Record<`data-${string}`, unknown>;
	rowClassName?: string;
	contentClassName?: string;
	children: ReactNode;
};

export const CollapsiblePanel = ({
	label,
	actions,
	collapsible = true,
	defaultOpen = true,
	open: controlledOpen,
	onOpenChange,
	headingProps,
	rowClassName = "",
	contentClassName = "",
	children,
}: CollapsiblePanelProps) => {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
	const open = collapsible ? (controlledOpen ?? uncontrolledOpen) : true;
	const contentId = useId();
	const toggle = () => {
		if (controlledOpen === undefined) setUncontrolledOpen(!open);
		onOpenChange?.(!open);
	};
	const { className: headingClassName = "", ...restHeadingProps } =
		headingProps ?? {};
	const headerClassName =
		"flex min-h-12 min-w-0 items-center gap-1 text-sm font-semibold text-secondary focus-visible:outline-2 focus-visible:outline-accent";
	const content = (
		<>
			{collapsible ? (
				<button
					type="button"
					onClick={toggle}
					aria-expanded={open}
					aria-controls={contentId}
					className="inline-flex min-h-11 min-w-0 cursor-pointer items-center gap-1.5 rounded-md text-sm font-semibold text-secondary focus-visible:outline-2 focus-visible:outline-accent"
				>
					{label}
					<ChevronDown
						aria-hidden="true"
						className={`size-4 shrink-0 text-neutral-dark transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
					/>
				</button>
			) : (
				<span className="inline-flex min-h-11 min-w-0 items-center gap-1.5">
					{label}
				</span>
			)}
		</>
	);

	return (
		<>
			<div className="flex min-h-12 shrink-0 items-center gap-2 px-3 sm:px-4">
				{headingProps ? (
					<h2
						className={`m-0 ${headerClassName} ${headingClassName}`}
						{...restHeadingProps}
					>
						{content}
					</h2>
				) : (
					<div className={headerClassName}>{content}</div>
				)}
				{actions && (
					<div
						inert={!open}
						className={`ml-auto flex shrink-0 items-center transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none ${open ? "opacity-100" : "-translate-y-1 opacity-0"}`}
					>
						{actions}
					</div>
				)}
			</div>
			<div
				id={contentId}
				className={`grid min-h-0 transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"} ${rowClassName}`}
			>
				<div className="min-h-0 overflow-hidden" inert={!open}>
					<div className={contentClassName}>{children}</div>
				</div>
			</div>
		</>
	);
};
