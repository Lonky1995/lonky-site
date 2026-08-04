/**
 * 信号层 —— 这个 agent 真正的价值所在。
 *
 * 纯函数，不碰网络、不碰磁盘。输入快照，输出「值得看一眼的话题」。
 *
 * 核心判断：**增速比绝对热度重要。** 一条已经冲到榜首的热点，等你做完
 * 内容早就过去了；真正有用的是还在半山腰但涨得快的。所以打分里增速
 * 权重（0.6）高于绝对热度（0.4）。
 *
 * 相关度是**乘数**而不是加数：跟账号无关的话题再热也应该归零，
 * 否则热榜上的娱乐八卦会淹掉一切。
 */

import { PAIN_PHRASES } from "../xhs-research/patterns";
import type { Pillar } from "./config";
import type { Signal, SignalKind, Snapshot, TrendItem } from "./types";

// --- 文本归一化 ---

/**
 * 跨快照追踪用的键。平台的 item id 经常变（尤其是榜单重排时），
 * 但话题文本相对稳定，所以用归一化后的文本做键。
 */
export function normalizeKey(title: string): string {
  return (
    title
      .toLowerCase()
      // 先整段去掉短标记：平台每次给话题打的【热】【新】【首发】不固定，
      // 留着会让同一话题在不同快照拿到不同 key，增速就永远算不出来。
      // 只删 3 字以内的，更长的括号内容通常是正文而非标记。
      .replace(/[【〖\[]([^】〗\]]{0,3})[】〗\]]/g, "")
      .replace(/[（(]([^）)]{0,3})[）)]/g, "")
      .replace(/[【】\[\]（）()《》<>「」『』#＃"'"'!！?？。，,.、\-—_~～\s]/g, "")
      .trim()
  );
}

/** 2-gram 集合，用于相似度比较 */
function bigrams(text: string): Set<string> {
  const s = normalizeKey(text);
  const out = new Set<string>();
  for (let i = 0; i + 2 <= s.length; i++) out.add(s.slice(i, i + 2));
  return out;
}

/** Jaccard 相似度，用于去重 */
export function similarity(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return a === b ? 1 : 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / (A.size + B.size - inter);
}

// --- 相关度 ---

export interface Relevance {
  score: number;
  /** 最匹配的栏目 code，没有则为 null */
  pillar: string | null;
}

/**
 * 话题与账号栏目的匹配度。
 *
 * 计分曲线刻意让**单个关键词命中不够格**（1 命中只有 0.10，低于默认门槛
 * 0.15）：一个词撞上可能是巧合——"曝光""更新"这类词在娱乐八卦里也天天出现，
 * 两个词同时命中才算信号。命中数与得分：1→0.10，2→0.45，3→0.80，4→1.00。
 *
 * 痛点词额外 +0.15（封顶 0.3）——踩在受众真实需求上，即使没落进具体栏目
 * 也值得看，同时它能把"单栏目命中一次"的边缘话题托过门槛。
 */
export function scoreRelevance(title: string, pillars: Pillar[]): Relevance {
  const text = title.toLowerCase();

  let best = 0;
  let bestPillar: string | null = null;

  for (const p of pillars) {
    const hits = p.keywords.filter((k) => text.includes(k.toLowerCase())).length;
    const s = hits === 0 ? 0 : Math.min(1, hits * 0.35 - 0.25);
    if (s > best) {
      best = s;
      bestPillar = p.code;
    }
  }

  const painHits = PAIN_PHRASES.filter((p) => p.test.test(title)).length;
  const painBonus = Math.min(0.3, painHits * 0.15);

  return { score: Math.min(1, best + painBonus), pillar: bestPillar };
}

// --- 信号计算 ---

const KIND_WEIGHT: Record<SignalKind, number> = {
  spike: 1.5, // 突然涨起来的，最值得追
  newcomer: 1.3, // 新进榜，可能是苗头
  sustained: 1.1, // 持续在榜，适合做深度而非追快
  rising: 1.0,
};

export interface SignalOptions {
  pillars: Pillar[];
  minRelevance: number;
  spikeVelocity: number;
  sustainedAppearances: number;
}

/**
 * 把当前快照和历史比对，产出信号。
 *
 * @param current 本次采集
 * @param history 历史快照，按时间**从新到旧**排列
 */
export function computeSignals(
  current: Snapshot,
  history: Snapshot[],
  opts: SignalOptions,
): Signal[] {
  // 建索引：key -> 各历史快照里的热度（保持从新到旧的顺序）
  const past = new Map<string, number[]>();
  for (const snap of history) {
    const seenInThisSnapshot = new Set<string>();
    for (const item of snap.items) {
      if (seenInThisSnapshot.has(item.key)) continue;
      seenInThisSnapshot.add(item.key);
      const arr = past.get(item.key) ?? [];
      arr.push(item.heat);
      past.set(item.key, arr);
    }
  }

  const maxHeat = Math.max(1, ...current.items.map((i) => i.heat));
  const signals: Signal[] = [];
  const seen = new Set<string>();

  for (const item of current.items) {
    // 同一次快照里同一话题可能被多个来源采到，只保留热度最高的那条
    if (seen.has(item.key)) continue;
    seen.add(item.key);

    const rel = scoreRelevance(item.title, opts.pillars);
    if (rel.score < opts.minRelevance) continue;

    const heats = past.get(item.key) ?? [];
    const appearances = heats.length + 1;
    const prevHeat = heats[0];

    const velocity =
      prevHeat !== undefined && prevHeat > 0 ? (item.heat - prevHeat) / prevHeat : 0;

    const kind = classify(appearances, velocity, opts);
    const reasons = explain(item, kind, velocity, appearances, rel);

    // 新进榜没有历史增速，给中性偏乐观的 0.5——"进榜"本身就是信息
    const velocityNorm =
      kind === "newcomer" ? 0.5 : Math.min(Math.max(velocity, 0), 2) / 2;
    const heatNorm = item.heat / maxHeat;

    const score =
      rel.score * KIND_WEIGHT[kind] * (0.4 * heatNorm + 0.6 * velocityNorm);

    signals.push({
      key: item.key,
      title: item.title,
      sourceId: item.sourceId,
      url: item.url,
      heat: item.heat,
      kind,
      velocity: round(velocity),
      appearances,
      relevance: round(rel.score),
      score: round(score),
      reasons,
    });
  }

  return signals.sort((a, b) => b.score - a.score);
}

function classify(
  appearances: number,
  velocity: number,
  opts: SignalOptions,
): SignalKind {
  if (appearances === 1) return "newcomer";
  if (velocity >= opts.spikeVelocity) return "spike";
  if (appearances >= opts.sustainedAppearances) return "sustained";
  return "rising";
}

function explain(
  item: TrendItem,
  kind: SignalKind,
  velocity: number,
  appearances: number,
  rel: Relevance,
): string[] {
  const out: string[] = [];

  if (kind === "newcomer") out.push("首次进榜");
  if (kind === "spike") out.push(`热度较上次 +${Math.round(velocity * 100)}%`);
  if (kind === "rising" && velocity > 0) out.push(`小幅上涨 +${Math.round(velocity * 100)}%`);
  if (kind === "sustained") out.push(`已连续出现 ${appearances} 次，适合做深度而非追快`);

  if (rel.pillar) out.push(`落在栏目 ${rel.pillar}`);
  else out.push("未落进具体栏目，但踩中受众痛点");

  if (item.rank !== undefined && item.rank <= 10) out.push(`榜单第 ${item.rank} 位`);

  return out;
}

function round(n: number, d = 3): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

// --- 去重 ---

/**
 * 滤掉与近期已推送过的选题太像的信号。
 * 没有这一步，持续热点会被天天重复推送，很快就没人看推送了。
 */
export function dropRecentlySeen(
  signals: Signal[],
  recentTitles: string[],
  threshold: number,
): { kept: Signal[]; dropped: { signal: Signal; matched: string }[] } {
  const kept: Signal[] = [];
  const dropped: { signal: Signal; matched: string }[] = [];

  for (const s of signals) {
    const hit = recentTitles.find((t) => similarity(s.title, t) >= threshold);
    if (hit) dropped.push({ signal: s, matched: hit });
    else kept.push(s);
  }

  return { kept, dropped };
}
