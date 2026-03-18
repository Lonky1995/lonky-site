"use client";

export function GradientText({
  children,
  variant = "blue",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "blue" | "cyan";
  className?: string;
}) {
  return (
    <span
      className={`${variant === "cyan" ? "gradient-text-cyan" : "gradient-text"} ${className}`}
    >
      {children}
    </span>
  );
}
