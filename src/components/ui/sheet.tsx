import { Dialog as SheetPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

const Sheet = (props: React.ComponentProps<typeof SheetPrimitive.Root>) => (
	<SheetPrimitive.Root data-slot="sheet" {...props} />
);

const SheetTrigger = (
	props: React.ComponentProps<typeof SheetPrimitive.Trigger>,
) => <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;

const SheetClose = (
	props: React.ComponentProps<typeof SheetPrimitive.Close>,
) => <SheetPrimitive.Close data-slot="sheet-close" {...props} />;

type SheetContentProps = React.ComponentProps<typeof SheetPrimitive.Content> & {
	portalContainer?: React.ComponentProps<
		typeof SheetPrimitive.Portal
	>["container"];
};

const SheetContent = ({
	className,
	portalContainer,
	...props
}: SheetContentProps) => (
	<SheetPrimitive.Portal container={portalContainer ?? undefined}>
		<SheetPrimitive.Content
			data-slot="sheet-content"
			className={cn(
				"absolute inset-y-0 right-0 z-50 flex h-full w-[min(24rem,85vw)] flex-col border-l border-border bg-surface text-secondary shadow-xl outline-none data-[state=open]:animate-[annotation-sheet-enter_200ms_ease-in-out_both] data-[state=closed]:animate-[annotation-sheet-exit_200ms_ease-in-out_both]",
				className,
			)}
			{...props}
		/>
	</SheetPrimitive.Portal>
);

const SheetTitle = ({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) => (
	<SheetPrimitive.Title
		data-slot="sheet-title"
		className={cn("font-semibold text-secondary", className)}
		{...props}
	/>
);

const SheetDescription = ({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) => (
	<SheetPrimitive.Description
		data-slot="sheet-description"
		className={className}
		{...props}
	/>
);

export {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
};
