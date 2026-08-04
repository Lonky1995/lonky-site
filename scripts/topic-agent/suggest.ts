/**
 * 选题生成：信号 → DeepSeek → 选题建议 → 否决清单过滤。
 *
 * 分成三段是刻意的：
 * - buildPrompt / parseSuggestions / applyVeto 是纯函数，可测
 * - 只有 callModel 碰网络
 *
 * 否决清单跑在模型**之后**且是确定性正则：模型再怎么飘，
 * 割韭菜话术也进不到推送卡片里。这比在 prompt 里叮嘱可靠得多。
 */

import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { PERSONA, PILLARS, VETO_RULES } from "./config";
import type { Signal, TopicSuggestion } from "./types";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

const model = deepseek.chatModel("deepseek-chat");

// --- Prompt ---

export function buildSystemPrompt(): string {
  const pillars = PILLARS.map(
    (p) => `- ${p.code} ${p.name}（目标占比 ${Math.round(p.targetShare * 100)}%）：${p.keywords.slice(0, 6).join("、")}`,
  ).join("\n");

  return [
    "你在为一个小红书/抖音账号做选题。账号定位：",
    `- 一句话：${PERSONA.oneLiner}`,
    `- 受众：${PERSONA.audience}`,
    `- 语气：${PERSONA.voice}`,
    "",
    "内容栏目：",
    pillars,
    "",
    "硬性要求：",
    "1. 选题必须建立在她能**真实做到**的事情上（真的去接单、真的去投简历、真的去买课踩坑），不要编造无法验证的经历。",
    "2. 禁止出现：月入过万、躺赚、被动收入、零基础人人可做、名额有限、风口红利、弯道超车。",
    "3. 不讲技术原理、不讲模型对比、不讲 prompt 工程。受众要的是能不能用，不是怎么实现。",
    "4. 标题用第一人称、具体、可验证。避免「N 个工具推荐」这类已饱和的清单体。",
    "5. 每条建议必须说清楚「为什么是现在」——它跟哪个热点信号相关。",
    "",
    "严格返回 JSON 数组，不要 markdown 代码块，不要任何解释文字。每个元素形如：",
    '{"title":"","angle":"","hook":"","pillar":"A","whyNow":"","sourceKeys":[""]}',
    "字段含义：title=选题标题；angle=切入角度，同一热点她该怎么讲才是她的；",
    "hook=开头三秒的第一句话；pillar=栏目 code；whyNow=时效性理由；sourceKeys=关联的信号 key。",
  ].join("\n");
}

export function buildUserPrompt(signals: Signal[], count: number): string {
  const lines = signals.map(
    (s) =>
      `- key=${s.key} | ${s.title} | 类型=${s.kind} | 热度=${s.heat} | 增速=${s.velocity} | 相关度=${s.relevance} | ${s.reasons.join("；")}`,
  );

  return [
    `以下是刚采集到的热点信号，按重要性排序：`,
    "",
    ...lines,
    "",
    `请从中挑出最值得做的，产出 ${count} 条选题建议。`,
    "不要每条信号都用——挑真正跟账号定位有关、且她能做出真实内容的。",
    "如果某个信号很热但跟定位无关，直接忽略，宁可少给几条。",
  ].join("\n");
}

// --- 解析 ---

export function parseSuggestions(raw: string): TopicSuggestion[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`模型返回里没有 JSON 数组: ${raw.slice(0, 200)}`);

  const parsed: unknown = JSON.parse(match[0]);
  if (!Array.isArray(parsed)) throw new Error("模型返回的不是数组");

  return parsed
    .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    .map((x) => ({
      title: String(x.title ?? "").trim(),
      angle: String(x.angle ?? "").trim(),
      hook: String(x.hook ?? "").trim(),
      pillar: String(x.pillar ?? "").trim(),
      whyNow: String(x.whyNow ?? "").trim(),
      sourceKeys: Array.isArray(x.sourceKeys) ? x.sourceKeys.map(String) : [],
    }))
    .filter((s) => s.title.length > 0);
}

// --- 否决清单 ---

export function applyVeto(suggestions: TopicSuggestion[]): {
  passed: TopicSuggestion[];
  rejected: { suggestion: TopicSuggestion; reason: string }[];
} {
  const passed: TopicSuggestion[] = [];
  const rejected: { suggestion: TopicSuggestion; reason: string }[] = [];

  for (const s of suggestions) {
    // 整条建议都要过检，不只是标题——钩子里塞骗局话术一样致命
    const text = `${s.title} ${s.angle} ${s.hook} ${s.whyNow}`;
    const hit = VETO_RULES.find((r) => r.test.test(text));
    if (hit) rejected.push({ suggestion: s, reason: `${hit.name}：${hit.why}` });
    else passed.push(s);
  }

  return { passed, rejected };
}

// --- 网络调用 ---

export async function suggestTopics(
  signals: Signal[],
  count: number,
): Promise<{ passed: TopicSuggestion[]; rejected: { suggestion: TopicSuggestion; reason: string }[] }> {
  if (signals.length === 0) return { passed: [], rejected: [] };

  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("缺少 DEEPSEEK_API_KEY");
  }

  const { text } = await generateText({
    model,
    system: buildSystemPrompt(),
    prompt: buildUserPrompt(signals, count),
  });

  return applyVeto(parseSuggestions(text));
}
