import { NextResponse } from "next/server";

// 仓位动态简报：从 My-vault（private）读 Grok 每天生成的简报 md，解析成结构化数据。
// 数据路径：trading/持仓动态/持仓动态_YYYY-MM-DD.md

const OWNER = "Lonky1995";
const REPO = "My-vault";
const DIR = "trading/持仓动态";

type TickerBlock = {
  symbol: string;
  impact: string; // 影响等级
  sections: { title: string; body: string }[];
};

type CalEvent = {
  date: string; // YYYY-MM-DD
  mdRaw: string; // 原始 M/D 表达
  symbol: string;
  text: string; // 事件描述
};

type BriefData = {
  date: string;
  tickers: TickerBlock[];
  portfolioInsight: string; // 组合层面洞察原文
  events: CalEvent[]; // 从"下一步观察点"提取的日历事件
  raw: string;
};

// 把 "7/29" 结合简报年份补全为 YYYY-MM-DD。跨年处理：若月份 < 简报月份且差距大，视为次年。
function toFullDate(mmdd: string, briefDate: string): string | null {
  const m = mmdd.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const mon = parseInt(m[1], 10);
  const day = parseInt(m[2], 10);
  if (mon < 1 || mon > 12 || day < 1 || day > 31) return null;
  const briefYear = parseInt(briefDate.slice(0, 4), 10) || new Date().getFullYear();
  const briefMon = parseInt(briefDate.slice(5, 7), 10) || 1;
  // 事件月份比简报月份早 >6 个月 → 认为是明年
  const year = mon < briefMon - 6 ? briefYear + 1 : briefYear;
  return `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

async function ghFetch(path: string, token: string) {
  return fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    next: { revalidate: 300 },
  });
}

// 解析 Grok 简报 md → 结构化
function parseBrief(md: string, date: string): BriefData {
  const tickers: TickerBlock[] = [];
  const events: CalEvent[] = [];

  // 组合层面洞察：从 "### 2. 组合层面洞察" 到下一个 "###"
  const insightMatch = md.match(/###\s*2\.\s*组合层面洞察([\s\S]*?)(?:\n###|\n##|$)/);
  const portfolioInsight = insightMatch ? insightMatch[1].trim() : "";

  // 每个标的块：#### [SYMBOL] | 影响等级：X ... 到下一个 #### 或 ###
  const blockRe = /####\s*\[([^\]]+)\]\s*\|\s*影响等级：([^\n]+)\n([\s\S]*?)(?=\n####|\n###|$)/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(md)) !== null) {
    const symbol = m[1].trim();
    const impact = m[2].trim();
    const body = m[3];
    // 拆子字段：- **字段名**：内容
    const sections: { title: string; body: string }[] = [];
    const fieldRe = /-\s*\*\*([^*]+)\*\*：([\s\S]*?)(?=\n-\s*\*\*|$)/g;
    let f: RegExpExecArray | null;
    while ((f = fieldRe.exec(body)) !== null) {
      sections.push({ title: f[1].trim(), body: f[2].trim() });
    }
    tickers.push({ symbol, impact, sections });

    // 从"下一步观察点"提取事件日期（M/D + 描述）
    const watch = sections.find((s) => s.title.includes("下一步观察点"));
    if (watch) {
      // 匹配 "7/29 盘后"、"7/22 财报"、"7/24 派息" 等；日期后跟到分隔符前的短语
      const evRe = /(\d{1,2}\/\d{1,2})\s*([^，。；、\n)]{0,20})/g;
      let ev: RegExpExecArray | null;
      while ((ev = evRe.exec(watch.body)) !== null) {
        const full = toFullDate(ev[1], date);
        if (!full) continue;
        const txt = (ev[2] || "").trim();
        events.push({ date: full, mdRaw: ev[1], symbol, text: txt || "关注点" });
      }
    }
  }

  // 事件去重（同 symbol+date）+ 按日期排序
  const seen = new Set<string>();
  const uniqEvents = events
    .filter((e) => {
      const k = `${e.symbol}|${e.date}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return { date, tickers, portfolioInsight, events: uniqEvents, raw: md };
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN 未配置" }, { status: 500 });
  }

  try {
    // 1. 列目录，找最新日期文件
    const dirRes = await ghFetch(DIR, token);
    if (!dirRes.ok) {
      return NextResponse.json({ error: `读取简报目录失败 ${dirRes.status}` }, { status: 502 });
    }
    const files = (await dirRes.json()) as Array<{ name: string; path: string }>;
    const briefs = files
      .filter((f) => /持仓动态_\d{4}-\d{2}-\d{2}\.md$/.test(f.name))
      .sort((a, b) => b.name.localeCompare(a.name)); // 日期倒序
    if (briefs.length === 0) {
      return NextResponse.json({ error: "无简报文件", tickers: [] }, { status: 404 });
    }
    const latest = briefs[0];
    const dateMatch = latest.name.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : "";

    // 2. 读文件内容
    const fileRes = await ghFetch(latest.path, token);
    if (!fileRes.ok) {
      return NextResponse.json({ error: `读取简报失败 ${fileRes.status}` }, { status: 502 });
    }
    const fileData = (await fileRes.json()) as { content: string };
    const md = Buffer.from(fileData.content, "base64").toString("utf-8");

    // 3. 解析
    const parsed = parseBrief(md, date);
    // 可用的近期日期列表（供前端切换）
    const dates = briefs.slice(0, 14).map((f) => f.name.match(/(\d{4}-\d{2}-\d{2})/)?.[1]).filter(Boolean);
    return NextResponse.json({ ...parsed, availableDates: dates });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "读取失败";
    return NextResponse.json({ error: msg, tickers: [] }, { status: 502 });
  }
}
