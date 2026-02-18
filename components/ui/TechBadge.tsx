export function TechBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent">
      {label}
    </span>
  );
}
