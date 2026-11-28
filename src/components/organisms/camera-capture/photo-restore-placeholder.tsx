export const PhotoRestorePlaceholder = () => (
	<output
		aria-label="Restoring your photo"
		className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_min(40dvh,calc(100%_-_10rem))] overflow-hidden bg-surface text-secondary lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[minmax(0,1fr)] [@media(max-height:34rem)_and_(min-width:40rem)]:grid-cols-[minmax(0,1fr)_17rem] [@media(max-height:34rem)_and_(min-width:40rem)]:grid-rows-[minmax(0,1fr)]"
	>
		<section
			aria-hidden="true"
			className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-surface-muted"
		>
			<div className="flex min-h-11 items-center justify-between border-b border-border/60 bg-surface px-4">
				<span className="h-6 w-24 animate-pulse rounded-md bg-primary-light motion-reduce:animate-none" />
				<span className="h-3 w-28 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
			</div>
			<div className="grid min-h-0 min-w-0 place-items-center p-3 sm:p-6 [@media(max-height:34rem)_and_(min-width:40rem)]:p-3">
				<div className="aspect-[4/3] max-h-full w-full max-w-3xl animate-pulse rounded-md bg-secondary/10 motion-reduce:animate-none" />
			</div>
			<div className="flex min-h-11 items-center justify-between border-t border-border/60 bg-surface px-4">
				<span className="h-3 w-20 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
				<span className="h-9 w-24 animate-pulse rounded-md bg-primary-light motion-reduce:animate-none" />
			</div>
		</section>
		<aside
			aria-hidden="true"
			className="flex min-h-0 min-w-0 flex-col overflow-hidden border-t border-border/60 bg-surface lg:border-l lg:border-t-0 [@media(max-height:34rem)_and_(min-width:40rem)]:overflow-y-auto"
		>
			<div className="order-2 shrink-0 space-y-3 border-b border-border/60 p-4 lg:order-1 [@media(max-height:34rem)_and_(min-width:40rem)]:order-1">
				<div className="h-4 w-28 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
				<div className="h-3 w-36 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
				<div className="h-3 w-24 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
			</div>
			<div className="order-1 flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden p-4 lg:order-2 [@media(max-height:34rem)_and_(min-width:40rem)]:order-2 [@media(max-height:34rem)_and_(min-width:40rem)]:flex-none [@media(max-height:34rem)_and_(min-width:40rem)]:overflow-visible">
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
