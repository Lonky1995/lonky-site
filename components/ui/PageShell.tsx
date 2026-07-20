/** Shared page container for Apple-like layout */
export function PageShell({
  children,
  className = "",
  narrow = false,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div
      className={`apple-width ${narrow ? "apple-page-narrow" : ""} ${className}`}
      style={narrow ? { maxWidth: 720, width: "min(720px, calc(100vw - 48px))" } : undefined}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="apple-section-head" data-reveal style={{ paddingTop: 48, marginBottom: 40 }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {eyebrow && <p className="apple-eyebrow">{eyebrow}</p>}
          <h1 className="apple-section-title">{title}</h1>
          {subtitle && (
            <p className="apple-muted" style={{ marginTop: 16, maxWidth: "42ch" }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
