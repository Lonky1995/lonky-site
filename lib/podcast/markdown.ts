type ChatMessage = {
  role: string;
  content: string;
};

type NoteData = {
  title: string;
  slug: string;
  description?: string;
  date: string;
  tags?: string[];
  sourceUrl?: string;
  platform?: string;
  coverImage?: string;
  audioUrl?: string;
  duration?: number;
  summary: string;
  discussionSummary?: string;
  discussion?: ChatMessage[];
};

export function generateMarkdown(data: NoteData): string {
  const frontmatter = [
    "---",
    `title: "${escapeYaml(data.title)}"`,
    `slug: "${data.slug}"`,
    `description: "${escapeYaml(data.description || "")}"`,
    `date: "${data.date}"`,
    `category: "播客笔记"`,
    `tags: [${(data.tags || []).map((t) => `"${escapeYaml(t)}"`).join(", ")}]`,
    `published: true`,
    data.sourceUrl ? `sourceUrl: "${data.sourceUrl}"` : null,
    data.platform ? `platform: "${data.platform}"` : null,
    data.coverImage ? `coverImage: "${data.coverImage}"` : null,
    data.audioUrl ? `audioUrl: "${data.audioUrl}"` : null,
    data.duration ? `duration: ${data.duration}` : null,
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  let body = `${frontmatter}\n\n${data.summary}`;

  if (data.discussionSummary) {
    body += `\n\n---\n\n## 和 AI 深入讨论\n\n${data.discussionSummary}\n`;
    // Append raw conversation in collapsible block
    if (data.discussion && data.discussion.length > 0) {
      body += `\n<details>\n<summary>查看原始对话</summary>\n\n`;
      for (const msg of data.discussion) {
        if (msg.role === "user") {
          body += `**🙋 用户**\n\n${msg.content}\n\n---\n\n`;
        } else {
          body += `**🤖 AI**\n\n${msg.content}\n\n---\n\n`;
        }
      }
      body += `</details>\n`;
    }
  } else if (data.discussion && data.discussion.length > 0) {
    // Fallback: raw Q&A if no summary available
    body += `\n\n---\n\n## 和 AI 深入讨论\n\n`;
    for (const msg of data.discussion) {
      if (msg.role === "user") {
        body += `**🙋 ${msg.content}**\n\n`;
      } else {
        body += `${msg.content}\n\n`;
      }
    }
  }



  return body;
}

export function generateSlug(title: string): string {
  // Remove Chinese characters and non-ASCII, keep only a-z 0-9 and hyphens
  const base = title
    .toLowerCase()
    .replace(/[^\x20-\x7E]/g, "") // strip non-ASCII
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-|-$/g, "");
  // If title was mostly Chinese and base is empty/too short, use date-based slug
  if (base.length < 3) {
    return `podcast-${Date.now().toString(36)}`;
  }
  return base;
}

export function generateObsidianMarkdown(data: NoteData): string {
  const frontmatter = [
    "---",
    `title: "${escapeYaml(data.title)}"`,
    `date: "${data.date}"`,
    `tags: [podcast${data.tags?.length ? ", " + data.tags.join(", ") : ""}]`,
    data.sourceUrl ? `source: "${data.sourceUrl}"` : null,
    data.platform ? `platform: "${data.platform}"` : null,
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  return `${frontmatter}\n\n${data.summary}`;
}

function escapeYaml(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, " ");
}
