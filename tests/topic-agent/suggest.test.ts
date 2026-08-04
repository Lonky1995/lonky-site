import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  applyVeto,
  buildSystemPrompt,
  buildUserPrompt,
  parseSuggestions,
} from "../../scripts/topic-agent/suggest";
import { renderReport } from "../../scripts/topic-agent/render";
import type { RunResult, Signal, TopicSuggestion } from "../../scripts/topic-agent/types";

function sug(p: Partial<TopicSuggestion> & { title: string }): TopicSuggestion {
  return { angle: "", hook: "", pillar: "B", whyNow: "", sourceKeys: [], ...p };
}

// --- 否决清单 ---

test("否决清单拦下收益承诺类标题", () => {
  const { passed, rejected } = applyVeto([
    sug({ title: "我用AI接单第一个月赚了437块" }),
    sug({ title: "AI副业月入过万实操" }),
  ]);

  assert.equal(passed.length, 1);
  assert.equal(rejected.length, 1);
  assert.match(rejected[0].reason, /收益承诺/);
});

test("否决清单检查整条建议，不只是标题", () => {
  const { passed, rejected } = applyVeto([
    sug({ title: "一个正常的标题", hook: "零基础也能做，人人可做" }),
  ]);

  assert.equal(passed.length, 0, "钩子里的骗局话术也必须拦下");
  assert.match(rejected[0].reason, /零门槛/);
});

test("否决清单拦下技术腔", () => {
  const { rejected } = applyVeto([sug({ title: "prompt 工程入门", angle: "讲讲 token 怎么算" })]);
  assert.equal(rejected.length, 1);
  assert.match(rejected[0].reason, /技术腔/);
});

test("干净的建议全部通过", () => {
  const { passed, rejected } = applyVeto([
    sug({ title: "面试官问我空窗期，我这样回答", hook: "他问的时候我手心全是汗" }),
  ]);
  assert.equal(passed.length, 1);
  assert.equal(rejected.length, 0);
});

test("空输入不炸", () => {
  const { passed, rejected } = applyVeto([]);
  assert.deepEqual(passed, []);
  assert.deepEqual(rejected, []);
});

// --- 解析 ---

test("能从裸 JSON 数组解析", () => {
  const out = parseSuggestions(
    '[{"title":"标题A","angle":"角度","hook":"钩子","pillar":"A","whyNow":"因为","sourceKeys":["k1"]}]',
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].title, "标题A");
  assert.deepEqual(out[0].sourceKeys, ["k1"]);
});

test("能从 markdown 代码块里挖出 JSON", () => {
  const raw = '好的，这是建议：\n```json\n[{"title":"标题B"}]\n```\n希望有帮助';
  const out = parseSuggestions(raw);
  assert.equal(out.length, 1);
  assert.equal(out[0].title, "标题B");
});

test("缺字段时补空，不抛异常", () => {
  const out = parseSuggestions('[{"title":"只有标题"}]');
  assert.equal(out[0].angle, "");
  assert.deepEqual(out[0].sourceKeys, []);
});

test("丢掉没有标题的条目", () => {
  assert.equal(parseSuggestions('[{"title":""},{"title":"有效"}]').length, 1);
});

test("完全不是 JSON 时抛出可读错误", () => {
  assert.throws(() => parseSuggestions("我无法完成这个请求"), /没有 JSON 数组/);
});

// --- Prompt ---

test("system prompt 带上人设、栏目和禁用词", () => {
  const p = buildSystemPrompt();
  assert.match(p, /全职妈妈/);
  assert.match(p, /A 避坑打假/);
  assert.match(p, /月入过万/);
});

test("user prompt 列出信号并说明可以少给", () => {
  const signals = [
    {
      key: "k1",
      title: "AI课投诉激增",
      kind: "spike",
      heat: 5000,
      velocity: 1.2,
      relevance: 0.8,
      reasons: ["热度较上次 +120%"],
    },
  ] as Signal[];

  const p = buildUserPrompt(signals, 5);
  assert.match(p, /AI课投诉激增/);
  assert.match(p, /key=k1/);
  assert.match(p, /5 条/);
  assert.match(p, /宁可少给/);
});

// --- 渲染 ---

function runResult(p: Partial<RunResult> = {}): RunResult {
  return {
    runId: "2026-08-04T07-00-00",
    ranAt: "2026-08-04T07:00:00.000Z",
    itemsCollected: 42,
    signals: [],
    suggestions: [],
    rejected: [],
    ...p,
  };
}

test("有建议时报告包含标题、角度、钩子", () => {
  const md = renderReport(
    runResult({
      suggestions: [
        sug({ title: "面试官问我空窗期", angle: "从她自己的经历切入", hook: "手心全是汗", pillar: "D" }),
      ],
    }),
  );

  assert.match(md, /面试官问我空窗期/);
  assert.match(md, /情绪共鸣/, "栏目 code 应渲染成中文名");
  assert.match(md, /手心全是汗/);
});

test("无建议且无信号时，提示可能是采集挂了", () => {
  const md = renderReport(runResult());
  assert.match(md, /没有值得做的选题/);
  assert.match(md, /连续两天为空就该查采集/);
});

test("有信号但无建议时，仍把信号展示出来", () => {
  const md = renderReport(
    runResult({
      signals: [
        { title: "AI课投诉激增", kind: "spike", velocity: 1.2, relevance: 0.8 } as Signal,
      ],
    }),
  );
  assert.match(md, /AI课投诉激增/);
  assert.match(md, /\+120%/);
});

test("被否决的建议出现在报告里，便于调词典", () => {
  const md = renderReport(
    runResult({ rejected: [{ suggestion: sug({ title: "月入过万" }), reason: "收益承诺：xx" }] }),
  );
  assert.match(md, /被否决清单拦下 1 条/);
  assert.match(md, /月入过万/);
});

test("报告不含 NaN / undefined", () => {
  const md = renderReport(runResult({ suggestions: [sug({ title: "T" })] }));
  assert.ok(!md.includes("NaN"));
  assert.ok(!md.includes("undefined"));
});

// --- 存储 ---

test("快照存取往返，历史按从新到旧返回", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "topic-agent-"));
  process.env.TOPIC_AGENT_DIR = dir;

  const store = await import(`../../scripts/topic-agent/store?t=${Date.now()}`);

  store.saveSnapshot({ runId: "2026-08-01T07-00-00", capturedAt: "a", items: [] });
  store.saveSnapshot({ runId: "2026-08-03T07-00-00", capturedAt: "c", items: [] });
  store.saveSnapshot({ runId: "2026-08-02T07-00-00", capturedAt: "b", items: [] });

  const hist = store.loadHistory(10);
  assert.deepEqual(
    hist.map((s: { runId: string }) => s.runId),
    ["2026-08-03T07-00-00", "2026-08-02T07-00-00", "2026-08-01T07-00-00"],
    "必须从新到旧——computeSignals 依赖这个顺序取上一次热度",
  );

  const excluded = store.loadHistory(10, "2026-08-03T07-00-00");
  assert.ok(!excluded.some((s: { runId: string }) => s.runId === "2026-08-03T07-00-00"));

  assert.equal(store.pruneSnapshots(2), 1);
  assert.equal(store.loadHistory(10).length, 2);

  fs.rmSync(dir, { recursive: true, force: true });
  delete process.env.TOPIC_AGENT_DIR;
});

test("目录不存在时读历史返回空数组而不是抛错", async () => {
  process.env.TOPIC_AGENT_DIR = path.join(os.tmpdir(), `topic-agent-missing-${Date.now()}`);
  const store = await import(`../../scripts/topic-agent/store?t=${Date.now()}`);

  assert.deepEqual(store.loadHistory(5), []);
  assert.deepEqual(store.loadRecentSuggestionTitles(14), []);
  assert.equal(store.pruneSnapshots(5), 0);

  delete process.env.TOPIC_AGENT_DIR;
});
