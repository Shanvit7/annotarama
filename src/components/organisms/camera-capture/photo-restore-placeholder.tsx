export const PhotoRestorePlaceholder = () => (
	<output
		aria-label="Restoring your photo"
		className="grid min-h-0 flex-1 grid-rows-[max(17rem,40dvh)_auto] overflow-y-auto rounded-2xl bg-surface text-secondary md:grid-cols-[minmax(0,1fr)_20rem] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden [@media(max-height:34rem)_and_(min-width:40rem)]:grid-cols-[minmax(0,1fr)_17rem] [@media(max-height:34rem)_and_(min-width:40rem)]:grid-rows-[minmax(0,1fr)] [@media(max-height:34rem)_and_(min-width:40rem)]:overflow-hidden"
	>
		<section
			aria-hidden="true"
			className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-surface-muted"
		>
			<div className="flex min-h-11 items-center justify-between border-b border-border/60 bg-surface px-4">
				<span className="h-6 w-24 animate-pulse rounded-md bg-primary-light motion-reduce:animate-none" />
				<span className="h-3 w-28 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
			</div>
			<div className="grid min-h-0 place-items-center p-3 sm:p-6">
				<div className="aspect-[4/3] max-h-full w-full max-w-3xl animate-pulse rounded-md bg-secondary/10 motion-reduce:animate-none" />
			</div>
			<div className="flex min-h-11 items-center justify-between border-t border-border/60 bg-surface px-4">
				<span className="h-3 w-20 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
				<span className="h-9 w-24 animate-pulse rounded-md bg-primary-light motion-reduce:animate-none" />
			</div>
		</section>
		<aside
			aria-hidden="true"
			className="flex min-h-0 flex-col border-t border-border/60 bg-surface md:border-l md:border-t-0"
		>
			<div className="space-y-3 border-b border-border/60 p-4">
				<div className="h-4 w-28 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
				<div className="h-3 w-36 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
				<div className="h-3 w-24 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
			</div>
			<div className="flex-1 space-y-4 p-4">
				<div className="flex items-center justify-between">
					<div className="h-4 w-24 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
					<div className="size-5 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
				</div>
				<div className="h-3 w-32 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
			</div>
		</aside>
		<p className="sr-only">Restoring your photo…</p>
	</output>
);
