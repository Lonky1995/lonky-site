"use client";

export function AccentText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`text-accent-light ${className}`}>
      {children}
    </span>
  );
}
