import { Trash2 } from "lucide-react";
import { AlertDialog } from "radix-ui";
import { useRef } from "react";
import { createCallable, type PropsWithCall } from "react-call";

type AnnotationDeleteConfirmationProps = Record<string, never>;

const AnnotationDeleteDialog = ({
	call,
}: PropsWithCall<AnnotationDeleteConfirmationProps, boolean, unknown>) => {
	const confirmed = useRef(false);

	return (
		<AlertDialog.Root
			open
			onOpenChange={(open) => {
				if (!open && !call.ended) call.end(false);
			}}
		>
			<AlertDialog.Portal>
				<AlertDialog.Overlay className="fixed inset-0 z-50 bg-secondary/40" />
				<AlertDialog.Content
					onCloseAutoFocus={(event) => {
						// The caller focuses the surviving row after deletion.
						if (confirmed.current) event.preventDefault();
					}}
					className="fixed left-1/2 top-1/2 z-50 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-3 text-secondary shadow-lg outline-none"
				>
					<div className="flex items-start gap-2">
						<Trash2
							aria-hidden="true"
							className="mt-0.5 size-4 shrink-0 text-error"
						/>
						<div>
							<AlertDialog.Title className="m-0 text-base font-semibold tracking-[-0.02em]">
								Delete annotation?
							</AlertDialog.Title>
							<AlertDialog.Description className="mt-0.5 text-xs leading-4 text-neutral-dark">
								This can’t be undone.
							</AlertDialog.Description>
						</div>
					</div>
					<div className="mt-2 flex flex-col-reverse justify-end gap-1 sm:flex-row">
						<AlertDialog.Cancel asChild>
							<button
								type="button"
								className="min-h-9 cursor-pointer rounded-md px-2.5 text-sm font-medium text-neutral-dark transition-colors hover:bg-surface-muted hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
							>
								Cancel
							</button>
						</AlertDialog.Cancel>
						<AlertDialog.Action asChild>
							<button
								type="button"
								onClick={() => {
									confirmed.current = true;
									call.end(true);
								}}
								className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md bg-error px-3 text-sm font-medium text-surface transition-colors hover:bg-error/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
							>
								Delete
							</button>
						</AlertDialog.Action>
					</div>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	);
};

export const AnnotationDeleteConfirmation = createCallable<
	AnnotationDeleteConfirmationProps,
	boolean
>(AnnotationDeleteDialog);
