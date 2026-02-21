/**
 * Lightweight client-side Markdown → HTML converter.
 * Handles: headings, bold, italic, blockquotes, lists, checkboxes, code, hr, links.
 */
export function renderMarkdown(md: string, { injectIds = false }: { injectIds?: boolean } = {}): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inList = false;
  let inBlockquote = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Table row
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      // Skip separator row (| :--- | :--- |)
      if (/^\s*\|[\s:-]+\|\s*$/.test(line)) continue;

      closeList();
      closeBlockquote();

      const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());

      if (!inTable) {
        inTable = true;
        // First row is header
        html.push('<div class="overflow-x-auto my-4"><table class="w-full border-collapse text-sm">');
        html.push("<thead><tr>");
        for (const cell of cells) {
          html.push(`<th class="border border-border bg-card px-3 py-2 text-left font-semibold">${inline(cell)}</th>`);
        }
        html.push("</tr></thead><tbody>");
      } else {
        html.push("<tr>");
        for (const cell of cells) {
          html.push(`<td class="border border-border px-3 py-2 align-top">${inline(cell.replace(/<br\s*\/?>/g, "<br />"))}</td>`);
        }
        html.push("</tr>");
      }
      continue;
    } else if (inTable) {
      closeTable();
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      closeList();
      closeBlockquote();
      html.push('<hr class="my-4 border-border" />');
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      closeBlockquote();
      const level = headingMatch[1].length;
      const text = inline(headingMatch[2]);
      const sizes: Record<number, string> = {
        1: "text-xl font-bold mt-6 mb-3",
        2: "text-lg font-bold mt-5 mb-2",
        3: "text-base font-semibold mt-4 mb-2",
        4: "text-sm font-semibold mt-3 mb-1",
      };
      if (injectIds) {
        const rawText = headingMatch[2].replace(/\*\*/g, "").trim();
        const id = "preview-" + rawText.replace(/[^\w\u4e00-\u9fff\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase();
        html.push(`<h${level} id="${id}" class="${sizes[level] || sizes[3]}">${text}</h${level}>`);
      } else {
        html.push(`<h${level} class="${sizes[level] || sizes[3]}">${text}</h${level}>`);
      }
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      closeList();
      if (!inBlockquote) {
        inBlockquote = true;
        html.push('<blockquote class="border-l-2 border-accent/50 pl-3 my-3 text-muted italic">');
      }
      html.push(`<p>${inline(line.slice(2))}</p>`);
      continue;
    } else if (inBlockquote) {
      closeBlockquote();
    }

    // Checkbox list
    const checkMatch = line.match(/^[-*]\s+\[([x ])\]\s+(.+)$/);
    if (checkMatch) {
      if (!inList) {
        inList = true;
        html.push('<ul class="space-y-1 my-2">');
      }
      const checked = checkMatch[1] === "x";
      const text = inline(checkMatch[2]);
      html.push(
        `<li class="flex items-start gap-2"><span class="mt-0.5 flex-shrink-0">${
          checked ? "☑" : "☐"
        }</span><span>${text}</span></li>`
      );
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (!inList) {
        inList = true;
        html.push('<ul class="space-y-1 my-2 list-disc list-inside">');
      }
      html.push(`<li>${inline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList) {
        inList = true;
        html.push('<ol class="space-y-1 my-2 list-decimal list-inside">');
      }
      html.push(`<li>${inline(olMatch[1])}</li>`);
      continue;
    }

    // Close list if we're no longer in one
    if (inList) closeList();

    // Empty line — skip (spacing handled by element margins)
    if (line.trim() === "") continue;

    // Paragraph
    html.push(`<p class="my-1">${inline(line)}</p>`);
  }

  closeList();
  closeBlockquote();
  closeTable();

  return html.join("\n");

  function closeList() {
    if (inList) {
      // Check the last opening tag to close properly
      const lastOpen = html.findLast((h) => h.startsWith("<ul") || h.startsWith("<ol"));
      html.push(lastOpen?.startsWith("<ol") ? "</ol>" : "</ul>");
      inList = false;
    }
  }

  function closeBlockquote() {
    if (inBlockquote) {
      html.push("</blockquote>");
      inBlockquote = false;
    }
  }

  function closeTable() {
    if (inTable) {
      html.push("</tbody></table></div>");
      inTable = false;
    }
  }
}

/** Inline formatting: bold, italic, code, links, timestamps */
function inline(text: string): string {
  return text
    // Timestamp links [MM:SS] - convert to clickable buttons
    // Match both `[12:34]` (in code) and plain [12:34]
    .replace(/`?\[(\d{1,2}:\d{2})\]`?/g, (_, time) => {
      const [mm, ss] = time.split(":").map(Number);
      const seconds = mm * 60 + ss;
      return `<button class="inline-flex items-center gap-0.5 rounded bg-accent/10 px-1.5 py-0.5 text-xs font-mono text-accent hover:bg-accent/20 transition-colors cursor-pointer" onclick="document.dispatchEvent(new CustomEvent('podcast-seek',{detail:${seconds}}))">${time}</button>`;
    })
    // Code
    .replace(/`([^`]+)`/g, '<code class="rounded bg-border/50 px-1 py-0.5 text-xs font-mono">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent hover:underline" target="_blank" rel="noopener">$1</a>');
}
