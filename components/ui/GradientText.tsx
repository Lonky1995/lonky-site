"use client";

export function GradientText({
  children,
  variant = "purple",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "purple" | "cyan";
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
