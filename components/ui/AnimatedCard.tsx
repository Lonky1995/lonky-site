"use client";

export function AnimatedCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`apple-card ${className}`}
      data-reveal
      style={{ ["--delay" as string]: `${delay * 1000}ms` }}
    >
      {children}
    </div>
  );
}
