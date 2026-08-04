/**
 * 采集层 —— 唯一碰网络的地方，因此也是唯一脆弱的地方。
 *
 * 和 xhs-research/collect.ts 同样的取舍：**抓接口响应，不抓 DOM**。
 * 平台前端类名混淆且频繁改版，选择器几周就失效；接口结构稳定得多。
 * 这里对返回体做结构嗅探，不写死字段路径。
 *
 * 每个 source 独立失败：一个挂了不影响其他的，run.ts 会记录并继续。
 * 这一点对定时任务很重要——不能因为抖音改版就整个 agent 停摆。
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { SEARCH_KEYWORDS } from "./config";
import { normalizeKey } from "./signals";
import type { TrendItem } from "./types";

// --- playwright 最小类型（不进 package.json，理由见 README） ---

interface PwResponse {
  url(): string;
  headers(): Record<string, string>;
  json(): Promise<unknown>;
}

export interface PwPage {
  goto(url: string, opts?: { waitUntil?: "domcontentloaded" | "load" }): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  mouse: { wheel(dx: number, dy: number): Promise<void> };
  on(event: "response", handler: (res: PwResponse) => void): void;
  close(): Promise<void>;
}

export interface PwContext {
  newPage(): Promise<PwPage>;
  close(): Promise<void>;
}

interface PwModule {
  chromium: {
    launchPersistentContext(dir: string, opts: Record<string, unknown>): Promise<PwContext>;
  };
}

const PLAYWRIGHT: string = "playwright";

export const PROFILE_DIR =
  process.env.TOPIC_AGENT_PROFILE || path.join(os.homedir(), ".cache/topic-agent/profile");

export async function launchBrowser(headless: boolean): Promise<PwContext> {
  let pw: PwModule;
  try {
    pw = (await import(PLAYWRIGHT)) as PwModule;
  } catch {
    console.error("✗ 缺少 playwright：npm i -D playwright && npx playwright install chromium");
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
  });
}

// --- 结构嗅探工具 ---

type Json = Record<string, unknown>;

function isObj(v: unknown): v is Json {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const wan = v.match(/^([\d.]+)\s*[万wW]$/);
    if (wan) return Math.round(parseFloat(wan[1]) * 10000);
    const yi = v.match(/^([\d.]+)\s*亿$/);
    if (yi) return Math.round(parseFloat(yi[1]) * 1e8);
    const n = parseFloat(v.replace(/[,\s]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function walk(root: unknown, visit: (o: Json) => void): void {
  const stack: unknown[] = [root];
  let guard = 0;
  while (stack.length && guard++ < 200_000) {
    const cur = stack.pop();
    if (Array.isArray(cur)) {
      stack.push(...cur);
      continue;
    }
    if (!isObj(cur)) continue;
    visit(cur);
    for (const v of Object.values(cur)) {
      if (isObj(v) || Array.isArray(v)) stack.push(v);
    }
  }
}

// --- Source 定义 ---

export interface Source {
  id: string;
  label: string;
  collect(ctx: PwContext): Promise<TrendItem[]>;
}

/**
 * 收集一个页面在给定时间内命中的所有接口响应。
 * 用回调而非返回值，是因为响应是异步到达的，得先挂监听再导航。
 */
async function withResponses(
  ctx: PwContext,
  url: string,
  match: RegExp,
  dwellMs: number,
  onBody: (body: unknown) => void,
  scrolls = 0,
): Promise<void> {
  const page = await ctx.newPage();
  page.on("response", async (res) => {
    if (!match.test(res.url())) return;
    try {
      if (!(res.headers()["content-type"] ?? "").includes("json")) return;
      onBody(await res.json());
    } catch {
      // 读不出来就跳过，不影响主流程
    }
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(dwellMs);
    for (let i = 0; i < scrolls; i++) {
      await page.mouse.wheel(0, 2400);
      await page.waitForTimeout(2200);
    }
  } finally {
    await page.close();
  }
}

/** 抖音热榜。走官方榜单接口，比抓账号页稳定得多，也不容易触发风控。 */
export const douyinHot: Source = {
  id: "douyin-hot",
  label: "抖音热榜",
  async collect(ctx) {
    const items: TrendItem[] = [];
    const now = new Date().toISOString();

    await withResponses(
      ctx,
      "https://www.douyin.com/hot",
      /hot\/search\/list|hot_search|\/hot\//i,
      6000,
      (body) => {
        walk(body, (o) => {
          const word = o.word ?? o.sentence ?? o.title;
          if (typeof word !== "string" || word.trim().length < 2) return;
          // 热榜条目的判据：有词 + 有热度值
          const heat = toNumber(o.hot_value ?? o.hotValue ?? o.heat ?? o.view_count);
          if (heat <= 0) return;

          items.push({
            sourceId: "douyin-hot",
            key: normalizeKey(word),
            title: word.trim(),
            heat,
            rank: typeof o.position === "number" ? o.position : undefined,
            url: `https://www.douyin.com/search/${encodeURIComponent(word)}`,
            capturedAt: now,
          });
        });
      },
    );

    return dedupeByKey(items);
  },
};

/** 小红书赛道关键词。抓搜索结果里的笔记，用互动数合成热度。 */
export const xhsSearch: Source = {
  id: "xhs-search",
  label: "小红书赛道搜索",
  async collect(ctx) {
    const out: TrendItem[] = [];
    const now = new Date().toISOString();

    for (const kw of SEARCH_KEYWORDS) {
      const items: TrendItem[] = [];

      await withResponses(
        ctx,
        `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(kw)}&type=51`,
        /xiaohongshu\.com\/api\/.*(search|feed|note)/i,
        3000,
        (body) => {
          walk(body, (o) => {
            const id = o.note_id ?? o.noteId ?? o.id;
            const title = o.display_title ?? o.displayTitle ?? o.title;
            if (typeof id !== "string" || typeof title !== "string" || !title.trim()) return;
            if (!/^[0-9a-f]{20,}$/i.test(id)) return;

            const it = isObj(o.interact_info) ? o.interact_info : o;
            const likes = toNumber(it.liked_count ?? it.likedCount);
            const collects = toNumber(it.collected_count ?? it.collectedCount);
            const comments = toNumber(it.comment_count ?? it.commentCount);

            // 合成热度：收藏和评论比点赞更能说明内容有用/有共鸣，故加权
            const heat = likes + collects * 2 + comments * 3;
            if (heat <= 0) return;

            items.push({
              sourceId: `xhs-search:${kw}`,
              key: normalizeKey(title),
              title: title.trim(),
              heat,
              url: `https://www.xiaohongshu.com/explore/${id}`,
              capturedAt: now,
            });
          });
        },
        3,
      );

      out.push(...items);
      // 关键词之间停一下，别把节奏打太密
      await new Promise((r) => setTimeout(r, 5000));
    }

    return dedupeByKey(out);
  },
};

/** 同一 key 只保留热度最高的一条 */
function dedupeByKey(items: TrendItem[]): TrendItem[] {
  const best = new Map<string, TrendItem>();
  for (const it of items) {
    const prev = best.get(it.key);
    if (!prev || it.heat > prev.heat) best.set(it.key, it);
  }
  return [...best.values()];
}

export const SOURCES: Source[] = [douyinHot, xhsSearch];
