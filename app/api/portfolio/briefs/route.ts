import { NextResponse } from "next/server";

// 持仓动态简报：从 My-vault（private）读取每日简报并解析成结构化数据。
// 兼容历史的「持仓动态_YYYY-MM-DD.md」和当前的
// 「X每日持仓动态简报 | YYYY-MM-DD.md」两种命名。

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

function briefDateFromName(name: string): string | null {
  const match = name.match(
    /^(?:持仓动态_|X?每日持仓动态简报\s*[|｜]\s*)(\d{4}-\d{2}-\d{2})\.md$/,
  );
  return match?.[1] ?? null;
}

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

function parseSections(body: string): { title: string; body: string }[] {
  // 兼容：
  // - **字段名**：内容
  // **字段名：**
  // 内容
  const fieldRe =
    /^(?:-\s*)?\*\*(?:([^*\n]+?)\*\*\s*[：:]|([^*\n]+?)[：:]\*\*)\s*/gm;
  const matches = Array.from(body.matchAll(fieldRe)).filter((match) => {
    const title = (match[1] ?? match[2] ?? "").trim();
    return /^(?:关键事实|上下游\s*\+\s*竞品|🌐?外部背景|KB\s*关联|来源|对\s*thesis\s*的影响|价格\/定位含义|下一步观察点)/i.test(
      title,
    );
  });

  return matches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = matches[index + 1]?.index ?? body.length;
      return {
        title: (match[1] ?? match[2] ?? "").trim(),
        body: body
          .slice(start, end)
          .replace(/\n?---\s*$/, "")
          .trim(),
      };
    })
    .filter((section) => section.title && section.body);
}

// 解析每日持仓动态 md → 结构化
export function parseBrief(md: string, date: string): BriefData {
  const tickers: TickerBlock[] = [];
  const events: CalEvent[] = [];

  // 组合层面洞察：从 "### 2. 组合层面洞察" 到下一个 "###"
  const insightMatch = md.match(/###\s*2\.\s*组合层面洞察([\s\S]*?)(?:\n###|\n##|$)/);
  const portfolioInsight = insightMatch ? insightMatch[1].trim() : "";

  // 标的标题兼容 #### [MSFT]、#### $MSFT 和 #### MSFT。
  const blockRe =
    /^####\s+(?:\[\$?([^\]]+)\]|\$?([A-Za-z0-9.-]+))\s*\|\s*影响等级[：:]\s*([^\n]+)\n([\s\S]*?)(?=^####\s|^###\s|(?![\s\S]))/gm;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(md)) !== null) {
    const symbol = (m[1] ?? m[2]).trim();
    const impact = m[3].trim();
    const body = m[4];
    const sections = parseSections(body);
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
  const token =
    process.env.GITHUB_TOKEN ||
    process.env.GITHUB_SITE_TOKEN ||
    process.env.GH_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN 未配置", tickers: [], portfolioInsight: "", date: "" },
      { status: 200 },
    );
  }

  try {
    // 1. 列目录，找最新日期文件
    const dirRes = await ghFetch(DIR, token);
    if (!dirRes.ok) {
      // 401/403 多为 token 无权读 My-vault，降级为空态避免整页报错
      const hint =
        dirRes.status === 401 || dirRes.status === 403
          ? `GitHub 鉴权失败 ${dirRes.status}（检查 GITHUB_TOKEN 是否有 My-vault 读权限）`
          : `读取简报目录失败 ${dirRes.status}`;
      return NextResponse.json(
        { error: hint, tickers: [], portfolioInsight: "", date: "" },
        { status: 200 },
      );
    }
    const files = (await dirRes.json()) as Array<{ name: string; path: string }>;
    const briefs = files
      .map((file) => ({ ...file, date: briefDateFromName(file.name) }))
      .filter(
        (file): file is typeof file & { date: string } => file.date !== null,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    if (briefs.length === 0) {
      return NextResponse.json({ error: "无简报文件", tickers: [] }, { status: 404 });
    }
    const latest = briefs[0];
    const date = latest.date;

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
    const dates = briefs.slice(0, 14).map((file) => file.date);
    return NextResponse.json({ ...parsed, availableDates: dates });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "读取失败";
    return NextResponse.json({ error: msg, tickers: [] }, { status: 502 });
  }
}
