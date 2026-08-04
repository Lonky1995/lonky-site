import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeSignals,
  dropRecentlySeen,
  normalizeKey,
  scoreRelevance,
  similarity,
} from "../../scripts/topic-agent/signals";
import { PILLARS, THRESHOLDS } from "../../scripts/topic-agent/config";
import type { Signal, Snapshot, TrendItem } from "../../scripts/topic-agent/types";

const OPTS = {
  pillars: PILLARS,
  minRelevance: THRESHOLDS.minRelevance,
  spikeVelocity: THRESHOLDS.spikeVelocity,
  sustainedAppearances: THRESHOLDS.sustainedAppearances,
};

function item(title: string, heat: number, extra: Partial<TrendItem> = {}): TrendItem {
  return {
    sourceId: "test",
    key: normalizeKey(title),
    title,
    heat,
    capturedAt: "2026-08-04T00:00:00.000Z",
    ...extra,
  };
}

function snap(runId: string, items: TrendItem[]): Snapshot {
  return { runId, capturedAt: `2026-08-04T${runId}:00:00.000Z`, items };
}

// --- 文本工具 ---

test("normalizeKey 抹掉装饰字符，让同一话题跨快照可追踪", () => {
  assert.equal(normalizeKey("【热】AI 副业，骗局！"), normalizeKey("AI副业骗局"));
  assert.equal(normalizeKey("#宝妈 重返职场#"), normalizeKey("宝妈重返职场"));
});

test("similarity 能识别近似标题", () => {
  assert.ok(similarity("宝妈用AI接单赚了437块", "宝妈用AI接单赚了437元") > 0.8);
  assert.ok(similarity("AI副业骗局揭秘", "今天天气不错") < 0.15);
  assert.equal(similarity("", ""), 1);
});

// --- 相关度 ---

test("相关度：赛道话题得分高，娱乐八卦得零分", () => {
  const on = scoreRelevance("全职妈妈重返职场被拒，简历空窗期怎么写", PILLARS);
  assert.ok(on.score > 0.4, `应高相关，实际 ${on.score}`);

  const off = scoreRelevance("某明星恋情曝光", PILLARS);
  assert.equal(off.score, 0, `娱乐八卦应为 0，实际 ${off.score}`);
});

test("相关度能定位到对应栏目", () => {
  assert.equal(scoreRelevance("AI课割韭菜套路曝光维权", PILLARS).pillar, "A");
  assert.equal(scoreRelevance("接单报价怎么谈，时薪结算", PILLARS).pillar, "B");
});

test("只踩痛点词但没落进栏目的，仍有基础分", () => {
  const r = scoreRelevance("带娃三年之后还能上岸吗", PILLARS);
  assert.ok(r.score > 0, "痛点词应贡献分数");
});

// --- 信号 ---

test("首次运行：无历史时全部是 newcomer", () => {
  const cur = snap("01", [item("AI副业骗局曝光", 1000), item("宝妈接单变现", 800)]);
  const signals = computeSignals(cur, [], OPTS);

  assert.equal(signals.length, 2);
  assert.ok(signals.every((s) => s.kind === "newcomer"));
  assert.ok(signals.every((s) => s.appearances === 1));
  assert.ok(signals.every((s) => s.velocity === 0));
});

test("增速达到阈值判为 spike，并算出正确涨幅", () => {
  const prev = snap("01", [item("AI副业骗局曝光", 1000)]);
  const cur = snap("02", [item("AI副业骗局曝光", 2000)]);

  const [s] = computeSignals(cur, [prev], OPTS);
  assert.equal(s.kind, "spike");
  assert.equal(s.velocity, 1); // 翻倍
  assert.ok(s.reasons.some((r) => r.includes("+100%")));
});

test("连续出现多次判为 sustained，提示做深度", () => {
  const hist = [
    snap("03", [item("宝妈接单变现", 1010)]),
    snap("02", [item("宝妈接单变现", 1005)]),
    snap("01", [item("宝妈接单变现", 1000)]),
  ];
  const cur = snap("04", [item("宝妈接单变现", 1015)]);

  const [s] = computeSignals(cur, hist, OPTS);
  assert.equal(s.kind, "sustained");
  assert.equal(s.appearances, 4);
  assert.ok(s.reasons.some((r) => r.includes("深度")));
});

test("★核心论断：涨得快的低热度话题应压过热度高但不涨的", () => {
  const prev = snap("01", [
    item("AI副业骗局曝光", 10000), // 已经很热
    item("宝妈接单变现", 1000), // 还在半山腰
  ]);
  const cur = snap("02", [
    item("AI副业骗局曝光", 10100), // 几乎不动 +1%
    item("宝妈接单变现", 3000), // +200%
  ]);

  const signals = computeSignals(cur, [prev], OPTS);
  assert.equal(
    signals[0].title,
    "宝妈接单变现",
    `增速应压过绝对热度，实际排序: ${signals.map((s) => s.title).join(" > ")}`,
  );
});

test("不相关话题被 minRelevance 挡掉", () => {
  const cur = snap("01", [
    item("某明星恋情曝光", 999999),
    item("AI副业骗局曝光", 100),
  ]);
  const signals = computeSignals(cur, [], OPTS);

  assert.equal(signals.length, 1);
  assert.equal(signals[0].title, "AI副业骗局曝光");
});

test("同一快照内重复 key 只保留一条", () => {
  const cur = snap("01", [
    item("AI副业骗局曝光", 500, { sourceId: "douyin-hot" }),
    item("AI副业骗局曝光", 800, { sourceId: "xhs-search" }),
  ]);
  assert.equal(computeSignals(cur, [], OPTS).length, 1);
});

test("热度归零或缺失不产生 NaN / Infinity", () => {
  const prev = snap("01", [item("宝妈接单变现", 0)]);
  const cur = snap("02", [item("宝妈接单变现", 0)]);

  const [s] = computeSignals(cur, [prev], OPTS);
  assert.ok(Number.isFinite(s.velocity), `velocity=${s.velocity}`);
  assert.ok(Number.isFinite(s.score), `score=${s.score}`);
});

test("热度下降时 velocity 为负，且不倒扣成负分", () => {
  const prev = snap("01", [item("宝妈接单变现", 1000)]);
  const cur = snap("02", [item("宝妈接单变现", 500)]);

  const [s] = computeSignals(cur, [prev], OPTS);
  assert.equal(s.velocity, -0.5);
  assert.ok(s.score >= 0, `分数不应为负，实际 ${s.score}`);
});

test("空快照返回空数组", () => {
  assert.deepEqual(computeSignals(snap("01", []), [], OPTS), []);
});

// --- 去重 ---

test("近期推过的选题被滤掉，新的保留", () => {
  const signals = [
    { title: "宝妈用AI接单赚了437块" },
    { title: "简历空窗期怎么写" },
  ] as Signal[];

  const { kept, dropped } = dropRecentlySeen(
    signals,
    ["宝妈用AI接单赚了437元"],
    THRESHOLDS.dedupeSimilarity,
  );

  assert.equal(kept.length, 1);
  assert.equal(kept[0].title, "简历空窗期怎么写");
  assert.equal(dropped.length, 1);
});

test("没有历史推送记录时全部保留", () => {
  const signals = [{ title: "任意标题" }] as Signal[];
  assert.equal(dropRecentlySeen(signals, [], 0.6).kept.length, 1);
});
