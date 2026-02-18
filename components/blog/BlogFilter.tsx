"use client";

export function BlogFilter({
  categories,
  active,
  onSelect,
}: {
  categories: string[];
  active: string;
  onSelect: (c: string) => void;
}) {
  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`rounded-full px-4 py-1.5 text-sm transition-all ${
            active === cat
              ? "bg-accent text-white"
              : "border border-border text-muted hover:border-accent hover:text-foreground"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
