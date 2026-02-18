#!/usr/bin/env npx tsx

/**
 * Obsidian Vault → Blog Content Sync Script
 *
 * Scans the Obsidian Vault for articles with `published: true` in frontmatter,
 * then copies them to `content/blog/` with transformations:
 * - [[wikilinks]] → plain text or standard markdown links
 * - ![[image.png]] → ![](blog-images/xxx.png) + copies image
 * - Removes inline #tags
 * - Uses slug from frontmatter as output filename
 */

import * as fs from "fs";
import * as path from "path";

// --- Config ---
const VAULT_PATH =
  process.env.VAULT_PATH ||
  path.join(
    process.env.HOME || "~",
    "Documents/Documents/Obsidian Vault"
  );
const OUTPUT_DIR = path.join(process.cwd(), "content/blog");
const IMAGE_OUTPUT_DIR = path.join(process.cwd(), "public/images/blog");

// --- Helpers ---
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseFrontmatter(content: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const data: Record<string, unknown> = {};
  match[1].split("\n").forEach((line) => {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    // Handle arrays: [a, b, c]
    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""));
    }
    // Handle booleans
    if (value === "true") value = true;
    if (value === "false") value = false;
    // Handle quoted strings
    if (typeof value === "string") {
      value = value.replace(/^["']|["']$/g, "");
    }

    data[key] = value;
  });

  return { data, body: match[2] };
}

function transformContent(body: string, _sourceDir: string): string {
  let result = body;

  // Transform ![[image.png]] → ![](images/blog/image.png)
  result = result.replace(
    /!\[\[([^\]]+\.(png|jpg|jpeg|gif|svg|webp))\]\]/gi,
    (_match, filename: string) => {
      // Try to find and copy the image
      const imagePath = findInVault(filename);
      if (imagePath) {
        ensureDir(IMAGE_OUTPUT_DIR);
        const dest = path.join(IMAGE_OUTPUT_DIR, filename);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(imagePath, dest);
          console.log(`  📷 Copied image: ${filename}`);
        }
      }
      return `![${filename}](/images/blog/${filename})`;
    }
  );

  // Transform [[wikilinks|display]] → display
  result = result.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");

  // Transform [[wikilinks]] → wikilinks (plain text)
  result = result.replace(/\[\[([^\]]+)\]\]/g, "$1");

  // Remove inline #tags (but not headings)
  result = result.replace(/(?<=\s)#(\w+)/g, "");

  return result;
}

function findInVault(filename: string): string | null {
  const search = (dir: string): string | null => {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".")) continue;
        const found = search(full);
        if (found) return found;
      } else if (entry.name === filename) {
        return full;
      }
    }
    return null;
  };
  return search(VAULT_PATH);
}

function findMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      results.push(...findMarkdownFiles(full));
    } else if (entry.name.endsWith(".md") && !entry.name.startsWith("_")) {
      results.push(full);
    }
  }
  return results;
}

// --- Main ---
function main() {
  console.log(`\n🔄 Syncing from: ${VAULT_PATH}`);
  console.log(`📁 Output to: ${OUTPUT_DIR}\n`);

  if (!fs.existsSync(VAULT_PATH)) {
    console.error(`❌ Vault not found at: ${VAULT_PATH}`);
    console.log("Set VAULT_PATH environment variable to your Obsidian vault.");
    process.exit(1);
  }

  ensureDir(OUTPUT_DIR);

  const files = findMarkdownFiles(VAULT_PATH);
  console.log(`📄 Found ${files.length} markdown files in vault\n`);

  let synced = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const { data, body } = parseFrontmatter(content);

    if (data.published !== true) continue;
    if (!data.slug) {
      console.log(`⚠️  Skipping (no slug): ${path.basename(file)}`);
      continue;
    }

    const slug = String(data.slug);
    const sourceDir = path.dirname(file);
    const transformed = transformContent(body, sourceDir);

    // Rebuild frontmatter for Velite
    const frontmatter = [
      "---",
      `title: "${data.title || path.basename(file, ".md")}"`,
      `slug: "${slug}"`,
      `description: "${data.description || ""}"`,
      `date: "${data.created || new Date().toISOString()}"`,
      `category: "${data.category || "Uncategorized"}"`,
      `tags: [${(Array.isArray(data.tags) ? data.tags : []).map((t) => `"${t}"`).join(", ")}]`,
      `published: true`,
      "---",
    ].join("\n");

    const output = `${frontmatter}\n\n${transformed.trim()}\n`;
    const outPath = path.join(OUTPUT_DIR, `${slug}.md`);

    fs.writeFileSync(outPath, output, "utf-8");
    console.log(`✅ ${slug}.md ← ${path.basename(file)}`);
    synced++;
  }

  console.log(`\n🎉 Synced ${synced} articles to content/blog/\n`);
}

main();
