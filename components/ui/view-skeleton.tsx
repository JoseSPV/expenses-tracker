/** Placeholder while browser-only data hydrates. */
export function ViewSkeleton() {
  return (
    <div aria-hidden className="flex animate-pulse flex-col gap-5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-surface-2" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-surface-2" />
    </div>
  );
}
