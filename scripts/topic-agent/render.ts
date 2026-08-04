/**
 * 把运行结果渲染成人能读的东西。
 * 纯函数，无 IO —— 推送渠道（飞书/微信/文件）都复用同一份文本。
 */

import { PILLARS } from "./config";
import type { RunResult, Signal, TopicSuggestion } from "./types";

const PILLAR_NAME = new Map(PILLARS.map((p) => [p.code, p.name]));

const KIND_LABEL: Record<string, string> = {
  spike: "突增",
  newcomer: "新进榜",
  rising: "上涨",
  sustained: "持续",
};

function suggestionBlock(s: TopicSuggestion, i: number): string {
  const pillar = PILLAR_NAME.get(s.pillar) ?? s.pillar;
  return [
    `**${i + 1}. ${s.title}**`,
    `　栏目：${pillar}`,
    `　角度：${s.angle}`,
    `　开头：「${s.hook}」`,
    `　为什么是现在：${s.whyNow}`,
  ].join("\n");
}

function signalLine(s: Signal): string {
  const bits = [KIND_LABEL[s.kind] ?? s.kind];
  if (s.velocity > 0) bits.push(`+${Math.round(s.velocity * 100)}%`);
  bits.push(`相关度 ${s.relevance}`);
  return `- ${s.title}　\`${bits.join(" · ")}\``;
}

export function renderReport(result: RunResult): string {
  const lines: string[] = [];

  lines.push(`# 今日选题　${result.ranAt.slice(0, 16).replace("T", " ")}`);
  lines.push("");

  if (result.suggestions.length === 0) {
    lines.push("今天没有值得做的选题。");
    lines.push("");
    lines.push(
      result.signals.length === 0
        ? "> 采集到的内容里没有与定位相关的信号。可能是采集挂了，也可能今天确实没热点——连续两天为空就该查采集。"
        : "> 有信号但都没通过筛选或否决清单。下面是原始信号，可以自己看看。",
    );
  } else {
    lines.push(...result.suggestions.map(suggestionBlock).flatMap((b) => [b, ""]));
  }

  if (result.signals.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push(`## 信号（共 ${result.signals.length} 条，展示前 10）`);
    lines.push("");
    lines.push(...result.signals.slice(0, 10).map(signalLine));
    lines.push("");
  }

  if (result.rejected.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push(`## 被否决清单拦下 ${result.rejected.length} 条`);
    lines.push("");
    for (const r of result.rejected) {
      lines.push(`- ~~${r.suggestion.title}~~　${r.reason}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push(`采集 ${result.itemsCollected} 条 · 信号 ${result.signals.length} 条 · runId \`${result.runId}\``);

  return lines.join("\n");
}

/** 飞书群机器人的 text 消息体。卡片格式以后再说，先把链路打通。 */
export function toLarkPayload(result: RunResult): Record<string, unknown> {
  return {
    msg_type: "text",
    content: { text: renderReport(result) },
  };
}
