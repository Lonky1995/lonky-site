/**
 * 解析 HowToCook 仓库的 Markdown 菜谱 → data/recipes.json
 *
 * 使用：
 *   1. 下载 HowToCook: curl -sL https://codeload.github.com/Anduin2017/HowToCook/tar.gz/master -o /tmp/howtocook.tar.gz && mkdir -p /tmp/HowToCook && tar -xzf /tmp/howtocook.tar.gz -C /tmp/HowToCook --strip-components=1
 *   2. 运行: npx tsx scripts/build-recipes.ts
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const SOURCE_ROOT = "/tmp/HowToCook/dishes";
const OUTPUT_PATH = join(process.cwd(), "data", "recipes.json");
const REPO_BASE_URL = "https://github.com/Anduin2017/HowToCook/blob/master/dishes";

type Category = "meat" | "vegetable" | "soup" | "staple" | "breakfast" | "aquatic";

interface Recipe {
  id: string;
  name: string;
  category: Category;
  difficulty: number; // 1-5
  ingredients: string[];
  steps: string[];
  sourceUrl: string;
}

const CATEGORY_MAP: Record<string, Category> = {
  meat_dish: "meat",
  vegetable_dish: "vegetable",
  soup: "soup",
  staple: "staple",
  breakfast: "breakfast",
  aquatic: "aquatic",
};

function parseMarkdown(content: string): { difficulty: number; ingredients: string[]; steps: string[] } | null {
  // 难度：★★★ 的数量
  const diffMatch = content.match(/难度[：:]\s*(★+)/);
  const difficulty = diffMatch ? diffMatch[1].length : 2;

  // 提取各个 ## 章节
  const sections: Record<string, string> = {};
  const sectionRegex = /##\s+([^\n]+)\n([\s\S]*?)(?=\n##\s|$)/g;
  let m;
  while ((m = sectionRegex.exec(content)) !== null) {
    sections[m[1].trim()] = m[2].trim();
  }

  // 食材：优先用「计算」章节（带克数），退回「必备原料」
  const ingredientsSrc = sections["计算"] || sections["必备原料和工具"] || sections["必备原料"] || "";
  const ingredients = ingredientsSrc
    .split("\n")
    .filter((l) => l.trim().startsWith("*") || l.trim().startsWith("-"))
    .map((l) => l.replace(/^\s*[*-]\s*/, "").trim())
    .filter((l) => l && !l.startsWith("按照") && !l.includes("份量"))
    .slice(0, 15);

  // 步骤：「操作」章节
  const stepsSrc = sections["操作"] || "";
  const steps = stepsSrc
    .split("\n")
    .filter((l) => /^\s*[*-]\s+/.test(l) && !/^\s{2,}/.test(l)) // 只取顶级 bullet
    .map((l) => l.replace(/^\s*[*-]\s*/, "").trim())
    .filter((l) => l.length > 3)
    .slice(0, 12);

  if (ingredients.length < 2 || steps.length < 2) return null;

  return { difficulty, ingredients, steps };
}

function collectRecipes(): Recipe[] {
  const recipes: Recipe[] = [];

  for (const [dir, category] of Object.entries(CATEGORY_MAP)) {
    const categoryPath = join(SOURCE_ROOT, dir);
    let entries: string[];
    try {
      entries = readdirSync(categoryPath);
    } catch {
      console.warn(`跳过 ${dir}（目录不存在）`);
      continue;
    }

    for (const entry of entries) {
      const entryPath = join(categoryPath, entry);
      const isDir = statSync(entryPath).isDirectory();

      let mdPath: string | null = null;
      let name: string;
      let sourceUrl: string;

      if (isDir) {
        // 文件夹形式：找到同名 .md
        const inner = readdirSync(entryPath).find((f) => f.endsWith(".md"));
        if (!inner) continue;
        mdPath = join(entryPath, inner);
        name = entry;
        sourceUrl = `${REPO_BASE_URL}/${dir}/${encodeURIComponent(entry)}/${encodeURIComponent(inner)}`;
      } else if (entry.endsWith(".md")) {
        mdPath = entryPath;
        name = entry.replace(/\.md$/, "");
        sourceUrl = `${REPO_BASE_URL}/${dir}/${encodeURIComponent(entry)}`;
      } else {
        continue;
      }

      const content = readFileSync(mdPath, "utf-8");
      const parsed = parseMarkdown(content);
      if (!parsed) {
        console.warn(`解析失败: ${name}`);
        continue;
      }

      recipes.push({
        id: `${category}-${name}`,
        name,
        category,
        ...parsed,
        sourceUrl,
      });
    }
  }

  return recipes;
}

const recipes = collectRecipes();
const byCategory = recipes.reduce<Record<string, number>>((acc, r) => {
  acc[r.category] = (acc[r.category] || 0) + 1;
  return acc;
}, {});

writeFileSync(OUTPUT_PATH, JSON.stringify({ recipes, count: recipes.length, byCategory }, null, 2), "utf-8");

console.log(`✅ 生成 ${recipes.length} 道菜谱 → ${OUTPUT_PATH}`);
console.log("分类统计：", byCategory);
