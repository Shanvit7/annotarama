import { AlertDialog } from "radix-ui";
import { createCallable } from "react-call";

type AnnotationDeleteConfirmationProps = {
	label?: string;
};

export const AnnotationDeleteConfirmation = createCallable<
	AnnotationDeleteConfirmationProps,
	boolean
>(({ call, label }) => (
	<AlertDialog.Root
		open
		onOpenChange={(open) => {
			if (!open && !call.ended) call.end(false);
		}}
	>
		<AlertDialog.Portal>
			<AlertDialog.Overlay className="fixed inset-0 z-50 bg-secondary/40" />
			<AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 text-secondary shadow-xl outline-none">
				<AlertDialog.Title className="m-0 text-lg font-semibold">
					Delete annotation?
				</AlertDialog.Title>
				<AlertDialog.Description className="mt-2 text-sm leading-5 text-neutral-dark">
					{label
						? `“${label}” will be removed from this photo.`
						: "This annotation will be removed from this photo."}{" "}
					This action cannot be undone.
				</AlertDialog.Description>
				<div className="mt-6 flex justify-end gap-3">
					<AlertDialog.Cancel asChild>
						<button
							type="button"
							className="min-h-11 cursor-pointer rounded-lg border border-border px-4 text-sm font-semibold text-secondary hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [@media(pointer:fine)]:min-h-10"
						>
							Cancel
						</button>
					</AlertDialog.Cancel>
					<AlertDialog.Action asChild>
						<button
							type="button"
							onClick={() => call.end(true)}
							className="min-h-11 cursor-pointer rounded-lg bg-error px-4 text-sm font-semibold text-surface hover:bg-error/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [@media(pointer:fine)]:min-h-10"
						>
							Delete annotation
						</button>
					</AlertDialog.Action>
				</div>
			</AlertDialog.Content>
		</AlertDialog.Portal>
	</AlertDialog.Root>
));
