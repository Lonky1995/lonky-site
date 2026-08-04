#!/usr/bin/env npx tsx

/**
 * 小红书竞品笔记采集
 *
 * 设计取舍：**优先抓接口响应，不抓 DOM**。
 * 小红书前端类名混淆且频繁改版，DOM 选择器几周就会失效；而搜索页背后的
 * JSON 接口结构稳定得多。所以这里监听 response，从返回体里"结构嗅探"出
 * 笔记对象——不写死字段路径，只要一个对象同时具备 id、标题、互动数就认。
 * DOM 抓取只作为兜底，且失败时会把页面 dump 下来供排查。
 *
 * 首次使用需要登录（扫码），登录态存在本地 profile 目录，之后复用。
 *
 * 用法：
 *   # 1) 先登录一次（会开浏览器，扫码后按回车）
 *   npx tsx scripts/xhs-research/collect.ts --login
 *
 *   # 2) 采集
 *   npx tsx scripts/xhs-research/collect.ts \
 *     --keywords "宝妈 AI 副业,全职妈妈 重返职场,AI 接单" \
 *     --limit 40 --out data/research/xhs-2026-08-04.json
 *
 * 前置：npm i -D playwright && npx playwright install chromium
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as readline from "readline";
import type { Dataset, Note } from "./types";

// --- Config ---

const PROFILE_DIR =
  process.env.XHS_PROFILE_DIR || path.join(os.homedir(), ".cache/xhs-research/profile");

const SEARCH_URL = (kw: string) =>
  `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(kw)}&type=51`;

/** 采集节奏。放慢是刻意的——被风控拉黑的代价远高于多等几分钟。 */
const SCROLL_PAUSE_MS = 2200;
const KEYWORD_PAUSE_MS = 6000;
const MAX_SCROLLS = 15;

// --- 结构嗅探 ---

type Json = Record<string, unknown>;

function isObj(v: unknown): v is Json {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    // 小红书会返回 "1.2万" / "3,456" 这类
    const wan = v.match(/^([\d.]+)\s*[万wW]$/);
    if (wan) return Math.round(parseFloat(wan[1]) * 10000);
    const n = parseFloat(v.replace(/[,\s]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function pick(o: Json, keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

/**
 * 递归遍历任意 JSON，捞出"看起来像笔记"的对象。
 * 判据：有 id 类字段 + 有标题类字段。互动数可能嵌在 interact_info 里。
 */
function harvestNotes(root: unknown, keyword: string, out: Map<string, Note>): void {
  const stack: unknown[] = [root];

  while (stack.length) {
    const cur = stack.pop();
    if (Array.isArray(cur)) {
      stack.push(...cur);
      continue;
    }
    if (!isObj(cur)) continue;

    for (const v of Object.values(cur)) {
      if (isObj(v) || Array.isArray(v)) stack.push(v);
    }

    const id = pick(cur, ["note_id", "noteId", "id"]);
    const title = pick(cur, ["display_title", "displayTitle", "title"]);
    if (typeof id !== "string" || typeof title !== "string" || !title.trim()) continue;
    // 笔记 id 是 24 位 hex，用它把用户/话题等同名字段挡掉
    if (!/^[0-9a-f]{20,}$/i.test(id)) continue;

    const interact = (isObj(cur.interact_info) ? cur.interact_info : cur) as Json;
    const user = (isObj(cur.user) ? cur.user : {}) as Json;

    const likes = num(pick(interact, ["liked_count", "likedCount", "likes"]));
    const collects = num(pick(interact, ["collected_count", "collectedCount", "collects"]));
    const comments = num(pick(interact, ["comment_count", "commentCount", "comments"]));

    const rawTags = pick(cur, ["tag_list", "tagList", "tags"]);
    const tags = Array.isArray(rawTags)
      ? rawTags
          .map((t) => (isObj(t) ? String(pick(t, ["name", "title"]) ?? "") : String(t)))
          .filter(Boolean)
      : [];

    const ts = pick(cur, ["time", "create_time", "createTime", "last_update_time"]);
    const publishedAt =
      typeof ts === "number" ? new Date(ts > 1e12 ? ts : ts * 1000).toISOString() : undefined;

    const typeRaw = String(pick(cur, ["type", "note_type"]) ?? "");

    const note: Note = {
      id,
      title: title.trim(),
      desc: typeof cur.desc === "string" ? cur.desc.slice(0, 500) : undefined,
      author: String(pick(user, ["nickname", "nick_name", "name"]) ?? "unknown"),
      authorId: typeof user.user_id === "string" ? user.user_id : undefined,
      likes,
      collects,
      comments,
      publishedAt,
      tags,
      type: /video/i.test(typeRaw) ? "video" : "image",
      url: `https://www.xiaohongshu.com/explore/${id}`,
      coverUrl: undefined,
      keyword,
      collectedAt: new Date().toISOString(),
    };

    // 同一笔记可能在多个响应里出现，保留互动数最全的那份
    const prev = out.get(id);
    if (!prev || note.likes > prev.likes) out.set(id, note);
  }
}

// --- 浏览器 ---

/**
 * playwright 只在本地调研时用，不进 package.json（否则 Vercel 每次构建都要拉 ~50MB）。
 * 因此这里自己声明用到的那一小片 API：既保住类型检查，又不会在没装依赖时
 * 让 `next build` 的 typecheck 挂掉，也不会在装了之后和官方类型打架。
 */
interface PwResponse {
  url(): string;
  headers(): Record<string, string>;
  json(): Promise<unknown>;
}

interface PwPage {
  goto(url: string, opts?: { waitUntil?: "domcontentloaded" | "load" | "networkidle" }): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  mouse: { wheel(deltaX: number, deltaY: number): Promise<void> };
  on(event: "response", handler: (res: PwResponse) => void): void;
  screenshot(opts: { path: string; fullPage?: boolean }): Promise<unknown>;
  content(): Promise<string>;
}

interface PwContext {
  newPage(): Promise<PwPage>;
  close(): Promise<void>;
}

interface PwModule {
  chromium: {
    launchPersistentContext(dir: string, opts: Record<string, unknown>): Promise<PwContext>;
  };
}

/** 用变量而非字面量，避免 TS 静态解析 'playwright' 而在未安装时报 TS2307 */
const PLAYWRIGHT: string = "playwright";

async function launch(headless: boolean): Promise<PwContext> {
  let pw: PwModule;
  try {
    pw = (await import(PLAYWRIGHT)) as PwModule;
  } catch {
    console.error(
      [
        "✗ 缺少 playwright。这个脚本是本地调研工具，依赖不随主项目安装：",
        "",
        "    npm i -D playwright",
        "    npx playwright install chromium",
        "",
      ].join("\n"),
    );
    process.exit(1);
  }

  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  return pw.chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: { width: 1440, height: 900 },
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
}

function waitForEnter(msg: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(msg, () => (rl.close(), resolve())));
}

async function doLogin() {
  console.log("打开小红书，请手动扫码登录。");
  const ctx = await launch(false);
  const page = await ctx.newPage();
  await page.goto("https://www.xiaohongshu.com/explore", { waitUntil: "domcontentloaded" });
  await waitForEnter("登录完成后按回车保存登录态… ");
  await ctx.close();
  console.log(`✓ 登录态已保存到 ${PROFILE_DIR}`);
}

async function collect(keywords: string[], limit: number, headless: boolean, debug: boolean) {
  const ctx = await launch(headless);
  const page = await ctx.newPage();
  const notes = new Map<string, Note>();
  let current = "";
  let responsesSeen = 0;

  page.on("response", async (res) => {
    const url = res.url();
    if (!/xiaohongshu\.com\/api\//.test(url)) return;
    if (!/search|feed|note/i.test(url)) return;
    try {
      const ct = res.headers()["content-type"] ?? "";
      if (!ct.includes("json")) return;
      const body = await res.json();
      responsesSeen++;
      harvestNotes(body, current, notes);
    } catch {
      // 响应体读不出来就跳过，不影响主流程
    }
  });

  for (const kw of keywords) {
    current = kw;
    const before = notes.size;
    console.log(`\n▶ 搜索「${kw}」`);

    await page.goto(SEARCH_URL(kw), { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(SCROLL_PAUSE_MS);

    for (let i = 0; i < MAX_SCROLLS; i++) {
      const got = [...notes.values()].filter((n) => n.keyword === kw).length;
      if (got >= limit) break;
      await page.mouse.wheel(0, 2400);
      await page.waitForTimeout(SCROLL_PAUSE_MS);
      process.stdout.write(`\r  已采集 ${got} 篇…`);
    }

    const got = notes.size - before;
    console.log(`\r  「${kw}」新增 ${got} 篇`);

    if (got === 0 && debug) {
      const stamp = kw.replace(/\s+/g, "_");
      await page.screenshot({ path: `debug-${stamp}.png`, fullPage: false });
      fs.writeFileSync(`debug-${stamp}.html`, await page.content());
      console.log(`  ⚠ 零命中，已导出 debug-${stamp}.png / .html`);
    }

    await page.waitForTimeout(KEYWORD_PAUSE_MS);
  }

  await ctx.close();

  if (notes.size === 0) {
    console.error(
      [
        "",
        "✗ 一篇都没采到。可能原因：",
        "  1. 登录态失效 → 重跑 --login",
        "  2. 触发风控（页面出现验证码）→ 换个时间、降低频率",
        "  3. 接口路径变了 → 用 --debug 导出页面，检查 page.on('response') 的过滤条件",
        `  （本次共拦截到 ${responsesSeen} 个疑似接口响应）`,
      ].join("\n"),
    );
  }

  return [...notes.values()];
}

// --- CLI ---

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : fallback;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  if (flag("login")) {
    await doLogin();
    return;
  }

  const keywords = (arg("keywords") ?? "宝妈 AI 副业,全职妈妈 重返职场,AI 接单 兼职")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const limit = parseInt(arg("limit", "40")!, 10);
  const out = arg("out", `data/research/xhs-${new Date().toISOString().slice(0, 10)}.json`)!;

  if (!fs.existsSync(PROFILE_DIR)) {
    console.error("✗ 未找到登录态，请先运行：npx tsx scripts/xhs-research/collect.ts --login");
    process.exit(1);
  }

  const notes = await collect(keywords, limit, flag("headless"), flag("debug"));

  const dataset: Dataset = {
    keywords,
    collectedAt: new Date().toISOString(),
    notes,
  };

  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(dataset, null, 2));

  console.log(`\n✓ 共 ${notes.length} 篇 → ${out}`);
  console.log(`  下一步: npx tsx scripts/xhs-research/analyze.ts ${out}`);

  if (notes.length === 0) process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
