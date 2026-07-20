"use client";

export function Section({
  children,
  title,
  subtitle,
  className = "",
  id,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`apple-width apple-section ${className}`}>
      {title && (
        <div className="apple-section-head" data-reveal>
          <h2 className="apple-section-title">{title}</h2>
          {subtitle && <p className="apple-muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
