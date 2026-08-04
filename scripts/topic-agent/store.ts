/**
 * 快照与运行结果的持久化。
 *
 * 用文件而不是数据库：数据量小（每天几十条），需要能直接打开看、
 * 能 diff、能手工改。上数据库对一台常开小机器上的定时任务是负担。
 */

import * as fs from "fs";
import * as path from "path";
import type { RunResult, Snapshot } from "./types";

export const ROOT = process.env.TOPIC_AGENT_DIR || path.join(process.cwd(), "data/topic-agent");
const SNAPSHOT_DIR = path.join(ROOT, "snapshots");
const RUN_DIR = path.join(ROOT, "runs");

function ensure(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

/** runId 用时间戳，天然按字典序 = 时间序 */
export function newRunId(now = new Date()): string {
  return now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

export function saveSnapshot(snap: Snapshot): string {
  ensure(SNAPSHOT_DIR);
  const file = path.join(SNAPSHOT_DIR, `${snap.runId}.json`);
  fs.writeFileSync(file, JSON.stringify(snap, null, 2));
  return file;
}

/**
 * 读最近 N 个历史快照，**从新到旧**排列。
 * computeSignals 依赖这个顺序取 prevHeat。
 */
export function loadHistory(limit: number, excludeRunId?: string): Snapshot[] {
  if (!fs.existsSync(SNAPSHOT_DIR)) return [];

  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  const out: Snapshot[] = [];
  for (const f of files) {
    if (out.length >= limit) break;
    const runId = f.replace(/\.json$/, "");
    if (excludeRunId && runId === excludeRunId) continue;
    try {
      out.push(JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, f), "utf-8")));
    } catch {
      // 单个快照损坏不该让整次运行失败
    }
  }
  return out;
}

export function saveRun(result: RunResult): string {
  ensure(RUN_DIR);
  const file = path.join(RUN_DIR, `${result.runId}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2));
  return file;
}

/**
 * 最近 N 天推送过的选题标题，用于去重。
 * 不去重的话持续热点会被天天重复推送，很快就没人看推送了。
 */
export function loadRecentSuggestionTitles(days: number, now = new Date()): string[] {
  if (!fs.existsSync(RUN_DIR)) return [];

  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  const titles: string[] = [];

  for (const f of fs.readdirSync(RUN_DIR).filter((f) => f.endsWith(".json"))) {
    try {
      const run: RunResult = JSON.parse(fs.readFileSync(path.join(RUN_DIR, f), "utf-8"));
      if (new Date(run.ranAt).getTime() < cutoff) continue;
      titles.push(...run.suggestions.map((s) => s.title));
    } catch {
      // 同上，坏文件跳过
    }
  }
  return titles;
}

/** 快照会无限增长，保留最近 N 个即可——增速计算只需要最近几次 */
export function pruneSnapshots(keep: number): number {
  if (!fs.existsSync(SNAPSHOT_DIR)) return 0;

  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  let removed = 0;
  for (const f of files.slice(keep)) {
    fs.unlinkSync(path.join(SNAPSHOT_DIR, f));
    removed++;
  }
  return removed;
}
