export function PageLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-10">
      <div className="panel flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-medium text-[var(--muted)]">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--primary)]" />
        </span>
        {label}
      </div>
    </div>
  );
}
