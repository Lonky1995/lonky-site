#!/usr/bin/env npx tsx

/**
 * 选题 agent 主流程。设计成可以挂 cron 每天跑。
 *
 *   采集 → 存快照 → 比对历史算信号 → 去重 → DeepSeek 生成 → 否决清单 → 推送
 *
 * 容错原则：**任何一个 source 挂掉都不能让整次运行失败。**
 * 定时任务最怕的是某天平台改版，整个 agent 就静默停摆了。
 *
 * 用法：
 *   npx tsx scripts/topic-agent/run.ts --login    # 首次：扫码登录抖音和小红书
 *   npx tsx scripts/topic-agent/run.ts --dry      # 只看信号，不调 DeepSeek
 *   npx tsx scripts/topic-agent/run.ts            # 完整跑一次
 *
 * cron 示例（每天 7:20 和 19:20 各跑一次）：
 *   20 7,19 * * * cd /path/to/lonky-site && npx tsx scripts/topic-agent/run.ts >> /tmp/topic-agent.log 2>&1
 */

import * as fs from "fs";
import * as path from "path";
import { PILLARS, THRESHOLDS } from "./config";
import { renderReport, toLarkPayload } from "./render";
import { computeSignals, dropRecentlySeen } from "./signals";
import { SOURCES, launchBrowser, type PwContext } from "./sources";
import {
  ROOT,
  loadHistory,
  loadRecentSuggestionTitles,
  newRunId,
  pruneSnapshots,
  saveRun,
  saveSnapshot,
} from "./store";
import { suggestTopics } from "./suggest";
import type { RunResult, Snapshot, TrendItem } from "./types";

const HISTORY_DEPTH = 8;
const SNAPSHOTS_TO_KEEP = 60;

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

// --- 登录 ---

async function doLogin() {
  const readline = await import("readline");
  const ctx = await launchBrowser(false);
  const page = await ctx.newPage();

  console.log("依次登录抖音和小红书。先打开抖音…");
  await page.goto("https://www.douyin.com", { waitUntil: "domcontentloaded" });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<void>((r) => rl.question(q, () => r()));

  await ask("抖音登录完成后按回车，会接着打开小红书… ");
  await page.goto("https://www.xiaohongshu.com/explore", { waitUntil: "domcontentloaded" });
  await ask("小红书登录完成后按回车保存… ");

  rl.close();
  await ctx.close();
  console.log("✓ 登录态已保存");
}

// --- 采集 ---

async function collectAll(ctx: PwContext): Promise<{ items: TrendItem[]; failures: string[] }> {
  const items: TrendItem[] = [];
  const failures: string[] = [];

  for (const source of SOURCES) {
    try {
      console.log(`▶ ${source.label}…`);
      const got = await source.collect(ctx);
      console.log(`  ${got.length} 条`);
      if (got.length === 0) failures.push(`${source.label}：零命中`);
      items.push(...got);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${source.label} 失败：${msg}`);
      failures.push(`${source.label}：${msg}`);
    }
  }

  return { items, failures };
}

// --- 推送 ---

async function push(result: RunResult): Promise<void> {
  const webhook = process.env.LARK_WEBHOOK_URL;
  if (!webhook) return;

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toLarkPayload(result)),
    });
    if (!res.ok) {
      console.error(`✗ 推送失败 HTTP ${res.status}`);
    } else {
      console.log("✓ 已推送到飞书");
    }
  } catch (err) {
    // 推送失败不该让整次运行算失败——报告已经落盘了
    console.error(`✗ 推送异常：${err instanceof Error ? err.message : String(err)}`);
  }
}

// --- 主流程 ---

async function main() {
  if (flag("login")) {
    await doLogin();
    return;
  }

  const runId = newRunId();
  const ranAt = new Date().toISOString();

  const ctx = await launchBrowser(!flag("headed"));
  let items: TrendItem[] = [];
  let failures: string[] = [];
  try {
    ({ items, failures } = await collectAll(ctx));
  } finally {
    await ctx.close();
  }

  if (failures.length === SOURCES.length) {
    console.error("\n✗ 所有采集源都失败了，很可能是登录态过期。重跑 --login。");
    process.exit(2);
  }

  const snapshot: Snapshot = { runId, capturedAt: ranAt, items };
  saveSnapshot(snapshot);

  const history = loadHistory(HISTORY_DEPTH, runId);
  console.log(`\n历史快照 ${history.length} 个${history.length === 0 ? "（首次运行，无法算增速）" : ""}`);

  const all = computeSignals(snapshot, history, {
    pillars: PILLARS,
    minRelevance: THRESHOLDS.minRelevance,
    spikeVelocity: THRESHOLDS.spikeVelocity,
    sustainedAppearances: THRESHOLDS.sustainedAppearances,
  });

  const recent = loadRecentSuggestionTitles(THRESHOLDS.dedupeLookbackDays);
  const { kept, dropped } = dropRecentlySeen(all, recent, THRESHOLDS.dedupeSimilarity);
  console.log(`信号 ${all.length} 条，去重后 ${kept.length} 条（去掉 ${dropped.length} 条近期推过的）`);

  const forLLM = kept.slice(0, THRESHOLDS.maxSignalsToLLM);

  let suggestions: RunResult["suggestions"] = [];
  let rejected: RunResult["rejected"] = [];

  if (flag("dry")) {
    console.log("\n--dry：跳过 DeepSeek");
  } else if (forLLM.length === 0) {
    console.log("\n没有可用信号，跳过 DeepSeek");
  } else {
    try {
      const out = await suggestTopics(forLLM, THRESHOLDS.suggestionCount);
      suggestions = out.passed;
      rejected = out.rejected;
      if (rejected.length > 0) console.log(`否决清单拦下 ${rejected.length} 条`);
    } catch (err) {
      // 模型挂了也要把信号留下来，人可以自己看
      console.error(`✗ 选题生成失败：${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const result: RunResult = {
    runId,
    ranAt,
    itemsCollected: items.length,
    signals: kept,
    suggestions,
    rejected,
  };

  saveRun(result);

  const report = renderReport(result);
  const reportFile = path.join(ROOT, "latest.md");
  fs.mkdirSync(ROOT, { recursive: true });
  fs.writeFileSync(reportFile, report);

  console.log(`\n${"─".repeat(50)}\n${report}\n${"─".repeat(50)}`);
  console.log(`\n报告：${reportFile}`);

  if (failures.length > 0) {
    console.warn(`\n⚠ 部分采集源异常：\n  ${failures.join("\n  ")}`);
  }

  await push(result);

  const pruned = pruneSnapshots(SNAPSHOTS_TO_KEEP);
  if (pruned > 0) console.log(`清理旧快照 ${pruned} 个`);
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invoked && import.meta.url === `file://${invoked}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
