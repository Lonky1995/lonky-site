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
    <div className="mb-8 flex flex-wrap gap-2" data-reveal>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className={active === cat ? "primary-button" : "secondary-button"}
          style={{ minHeight: 36, fontSize: "0.85rem", padding: "0 14px" }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
