#!/usr/bin/env npx tsx

/**
 * 竞品笔记分析器
 *
 * 读 collect.ts 产出的 dataset JSON，输出：
 * - 哪些标题结构真的跑得动（命中率 × 该结构的中位点赞）
 * - 收藏比 / 评论比 分位数 —— 区分"工具型内容"和"情绪型内容"
 * - 割韭菜话术在同赛道的渗透率（顺便当自己的否决清单校验）
 * - 高频表述、发布时间分布、各维度 Top 笔记
 *
 * 用法：
 *   npx tsx scripts/xhs-research/analyze.ts data/research/xhs-2026-08-04.json
 *   npx tsx scripts/xhs-research/analyze.ts <input.json> --out data/research/report
 *
 * 这个文件不碰网络，纯函数 + 文件读写，可以对任何符合 Dataset 结构的
 * 数据跑（手工整理的也行）。
 */

import * as fs from "fs";
import * as path from "path";
import type { Analysis, Dataset, Note, PatternHit, Quartiles } from "./types";
import type { Pattern } from "./patterns";
import { PAIN_PHRASES, RISK_PHRASES, STOPWORDS, TITLE_PATTERNS } from "./patterns";

// --- 统计基元 ---

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

function quartiles(xs: number[]): Quartiles {
  return {
    p25: round(quantile(xs, 0.25)),
    p50: round(quantile(xs, 0.5)),
    p75: round(quantile(xs, 0.75)),
  };
}

function round(n: number, digits = 3): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

// --- 模式命中 ---

function matchPatterns(notes: Note[], patterns: Pattern[]): PatternHit[] {
  const total = notes.length || 1;

  return patterns
    .map((p) => {
      const hits = notes.filter((n) => p.test.test(`${n.title} ${n.desc ?? ""}`));
      return {
        name: p.name,
        hint: p.hint,
        count: hits.length,
        share: round(hits.length / total),
        medianLikes: median(hits.map((n) => n.likes)),
        examples: hits
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 3)
          .map((n) => n.title),
      };
    })
    .sort((a, b) => b.count - a.count);
}

// --- 中文高频表述 ---

/**
 * 不做分词：按 2–4 字滑窗取 n-gram，滤掉停用词和纯符号，
 * 再用"更长的 gram 吸收更短的 gram"的方式去掉碎片。
 * 目的只是让反复出现的说法浮出来，不追求语言学正确。
 */
function topPhrases(notes: Note[], limit = 30): { phrase: string; count: number }[] {
  const counts = new Map<string, number>();
  const CJK = /[一-龥]/;

  for (const note of notes) {
    const text = `${note.title} ${note.desc ?? ""}`;
    const seen = new Set<string>();

    for (const seg of text.split(/[^一-龥a-zA-Z0-9]+/)) {
      if (!seg) continue;
      for (let len = 2; len <= 4; len++) {
        for (let i = 0; i + len <= seg.length; i++) {
          const gram = seg.slice(i, i + len);
          if (!CJK.test(gram)) continue;
          if (STOPWORDS.has(gram)) continue;
          // 同一篇笔记内重复出现只计一次，避免长文霸榜
          if (seen.has(gram)) continue;
          seen.add(gram);
          counts.set(gram, (counts.get(gram) ?? 0) + 1);
        }
      }
    }
  }

  const ranked = [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);

  // 若更长的 gram 出现次数相同，短的就是它的碎片，丢掉
  const kept: { phrase: string; count: number }[] = [];
  for (const [phrase, count] of ranked) {
    const absorbed = kept.some((k) => k.phrase.includes(phrase) && k.count === count);
    if (!absorbed) kept.push({ phrase, count });
    if (kept.length >= limit) break;
  }
  return kept;
}

// --- 主分析 ---

export function analyze(dataset: Dataset): Analysis {
  const notes = dataset.notes;
  const safeRatio = (num: number, den: number) => (den > 0 ? num / den : 0);

  const byKeyword: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const n of notes) {
    byKeyword[n.keyword] = (byKeyword[n.keyword] ?? 0) + 1;
    byType[n.type] = (byType[n.type] ?? 0) + 1;
  }

  const collectRatios = notes.map((n) => safeRatio(n.collects, n.likes));
  const commentRatios = notes.map((n) => safeRatio(n.comments, n.likes));

  const publishClock: { hour: number; count: number }[] = [];
  const hourCounts = new Map<number, number>();
  for (const n of notes) {
    if (!n.publishedAt) continue;
    const d = new Date(n.publishedAt);
    if (Number.isNaN(d.getTime())) continue;
    const h = d.getHours();
    hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
  }
  for (let h = 0; h < 24; h++) {
    if (hourCounts.has(h)) publishClock.push({ hour: h, count: hourCounts.get(h)! });
  }

  const withRatios = notes.map((n) => ({
    note: n,
    cr: safeRatio(n.collects, n.likes),
    mr: safeRatio(n.comments, n.likes),
  }));

  // Top 榜只看有基本量级的笔记，否则 3 赞 2 收藏的会霸榜。
  // 用 P25 而非中位数：中位数会把一半样本（含大量真实跑得动的内容）挡在外面。
  const likeFloor = Math.max(50, quantile(notes.map((n) => n.likes), 0.25));
  const eligible = withRatios.filter((x) => x.note.likes >= likeFloor);

  return {
    summary: {
      total: notes.length,
      byKeyword,
      byType,
      medianLikes: median(notes.map((n) => n.likes)),
      medianCollects: median(notes.map((n) => n.collects)),
      medianComments: median(notes.map((n) => n.comments)),
    },
    titlePatterns: matchPatterns(notes, TITLE_PATTERNS),
    riskPhrases: matchPatterns(notes, RISK_PHRASES),
    painPhrases: matchPatterns(notes, PAIN_PHRASES),
    engagement: {
      collectRatio: quartiles(collectRatios),
      commentRatio: quartiles(commentRatios),
    },
    phrases: topPhrases(notes),
    topNotes: {
      byLikes: [...notes].sort((a, b) => b.likes - a.likes).slice(0, 10),
      byCollectRatio: eligible.sort((a, b) => b.cr - a.cr).slice(0, 10).map((x) => x.note),
      byCommentRatio: eligible.sort((a, b) => b.mr - a.mr).slice(0, 10).map((x) => x.note),
    },
    publishClock,
  };
}

// --- Markdown 报告 ---

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function patternTable(hits: PatternHit[], baseline: number): string {
  const rows = hits
    .filter((h) => h.count > 0)
    .map((h) => {
      const lift = baseline > 0 ? h.medianLikes / baseline : 0;
      const flag = lift >= 1.3 ? " 🔺" : lift > 0 && lift <= 0.7 ? " 🔻" : "";
      return `| ${h.name} | ${h.count} | ${pct(h.share)} | ${h.medianLikes} | ${lift.toFixed(2)}×${flag} | ${h.hint} |`;
    });

  if (rows.length === 0) return "_无命中_\n";

  return [
    "| 模式 | 命中 | 占比 | 中位赞 | 相对大盘 | 说明 |",
    "| --- | ---: | ---: | ---: | ---: | --- |",
    ...rows,
  ].join("\n");
}

function noteList(notes: Note[], metric: (n: Note) => string): string {
  if (notes.length === 0) return "_数据不足_\n";
  return notes
    .map((n, i) => `${i + 1}. **${n.title}** — ${metric(n)}　\`@${n.author}\`　<${n.url}>`)
    .join("\n");
}

export function toMarkdown(a: Analysis, dataset: Dataset): string {
  const base = a.summary.medianLikes;
  const lines: string[] = [];

  lines.push(`# 小红书竞品分析报告`);
  lines.push("");
  lines.push(`- 采集时间：${dataset.collectedAt}`);
  lines.push(`- 搜索词：${dataset.keywords.map((k) => `\`${k}\``).join("、")}`);
  lines.push(`- 样本量：**${a.summary.total}** 篇`);
  lines.push(
    `- 中位数据：赞 ${a.summary.medianLikes} / 藏 ${a.summary.medianCollects} / 评 ${a.summary.medianComments}`,
  );
  lines.push("");

  lines.push(`## 一、内容形态分布`);
  lines.push("");
  for (const [type, n] of Object.entries(a.summary.byType)) {
    lines.push(`- ${type === "video" ? "视频" : "图文"}：${n} 篇（${pct(n / a.summary.total)}）`);
  }
  lines.push("");
  lines.push(`按搜索词：`);
  for (const [kw, n] of Object.entries(a.summary.byKeyword)) {
    lines.push(`- \`${kw}\`：${n} 篇`);
  }
  lines.push("");

  lines.push(`## 二、标题结构：什么写法真的跑得动`);
  lines.push("");
  lines.push(`「相对大盘」= 该结构的中位点赞 ÷ 全样本中位点赞。🔺 = 显著跑赢，🔻 = 显著跑输。`);
  lines.push("");
  lines.push(patternTable(a.titlePatterns, base));
  lines.push("");

  lines.push(`## 三、互动结构：工具型 vs 情绪型`);
  lines.push("");
  lines.push(`| 指标 | P25 | 中位 | P75 | 读法 |`);
  lines.push(`| --- | ---: | ---: | ---: | --- |`);
  lines.push(
    `| 收藏/点赞 | ${a.engagement.collectRatio.p25} | ${a.engagement.collectRatio.p50} | ${a.engagement.collectRatio.p75} | 高 = 干货教程型，吃搜索长尾 |`,
  );
  lines.push(
    `| 评论/点赞 | ${a.engagement.commentRatio.p25} | ${a.engagement.commentRatio.p50} | ${a.engagement.commentRatio.p75} | 高 = 情绪共鸣型，吃互动破圈 |`,
  );
  lines.push("");
  lines.push(
    `> 自己的内容发出后，把这两个比值和上表对齐，就知道内容落在哪个象限、和赛道基准差多少。`,
  );
  lines.push("");

  lines.push(`## 四、割韭菜话术渗透率`);
  lines.push("");
  lines.push(`同赛道有多少内容在用这些词。**这张表同时是自己的否决清单** —— 出现即需警惕。`);
  lines.push("");
  lines.push(patternTable(a.riskPhrases, base));
  lines.push("");

  lines.push(`## 五、痛点覆盖度`);
  lines.push("");
  lines.push(`受众在搜什么、同行在答什么。覆盖率低但痛点强的，就是空位。`);
  lines.push("");
  lines.push(patternTable(a.painPhrases, base));
  lines.push("");

  lines.push(`## 六、高频表述`);
  lines.push("");
  lines.push(
    a.phrases.length > 0
      ? a.phrases.map((p) => `\`${p.phrase}\`×${p.count}`).join("　")
      : "_样本不足_",
  );
  lines.push("");

  if (a.publishClock.length > 0) {
    lines.push(`## 七、发布时间分布`);
    lines.push("");
    const max = Math.max(...a.publishClock.map((p) => p.count));
    for (const { hour, count } of a.publishClock) {
      const bar = "█".repeat(Math.max(1, Math.round((count / max) * 24)));
      lines.push(`\`${String(hour).padStart(2, "0")}:00\` ${bar} ${count}`);
    }
    lines.push("");
  }

  lines.push(`## 八、Top 笔记`);
  lines.push("");
  lines.push(`### 点赞最高`);
  lines.push(noteList(a.topNotes.byLikes, (n) => `${n.likes} 赞`));
  lines.push("");
  lines.push(`### 收藏比最高（最值得抄结构的干货）`);
  lines.push(
    noteList(
      a.topNotes.byCollectRatio,
      (n) => `藏/赞 ${(n.likes ? n.collects / n.likes : 0).toFixed(2)}（${n.likes} 赞）`,
    ),
  );
  lines.push("");
  lines.push(`### 评论比最高（最值得抄话题的共鸣款）`);
  lines.push(
    noteList(
      a.topNotes.byCommentRatio,
      (n) => `评/赞 ${(n.likes ? n.comments / n.likes : 0).toFixed(2)}（${n.likes} 赞）`,
    ),
  );
  lines.push("");

  return lines.join("\n");
}

// --- CLI ---

function main() {
  const args = process.argv.slice(2);
  const input = args.find((a) => !a.startsWith("--"));
  if (!input) {
    console.error("用法: npx tsx scripts/xhs-research/analyze.ts <dataset.json> [--out <前缀>]");
    process.exit(1);
  }

  const outIdx = args.indexOf("--out");
  const outPrefix =
    outIdx >= 0 && args[outIdx + 1]
      ? args[outIdx + 1]
      : input.replace(/\.json$/, "") + "-report";

  const dataset: Dataset = JSON.parse(fs.readFileSync(input, "utf-8"));
  if (!Array.isArray(dataset.notes)) {
    console.error(`✗ ${input} 不是合法的 dataset（缺少 notes 数组）`);
    process.exit(1);
  }

  const result = analyze(dataset);
  const md = toMarkdown(result, dataset);

  fs.mkdirSync(path.dirname(path.resolve(outPrefix)), { recursive: true });
  fs.writeFileSync(`${outPrefix}.json`, JSON.stringify(result, null, 2));
  fs.writeFileSync(`${outPrefix}.md`, md);

  console.log(`✓ 分析 ${result.summary.total} 篇笔记`);
  console.log(`  ${outPrefix}.md`);
  console.log(`  ${outPrefix}.json`);
}

// 仅在本文件被直接执行时跑 CLI；被 import（如测试）时不跑
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invoked && import.meta.url === `file://${invoked}`) {
  main();
}
