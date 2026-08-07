export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-secondary">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-400 border-t-primary-800" />
      {label}
    </div>
  );
}
