import { z } from "zod";
import type { CryptoBreadthPayload } from "@/types/crypto-breadth";

// 只校验顶层字段是否存在、基本类型是否吻合，不逐字段深挖到叶子节点。
// VPS 端 Python 脚本迭代频繁，深层字段结构变化不应该让整页崩溃——
// 交给各展示组件内部的可选链 + 兜底文案处理。
const breadthPayloadSchema = z.object({
  generated_at_bjt: z.string(),
  state: z.object({ label: z.string(), code: z.string(), confidence: z.number() }),
  states: z.record(z.string(), z.unknown()),
  threshold_policy: z.object({ version: z.string(), review_cadence: z.string() }).passthrough(),
  alert_stage: z.object({ code: z.string(), label: z.string() }).passthrough(),
  universe: z.object({ source: z.string(), active_count: z.number() }).passthrough(),
  intervals: z.record(z.string(), z.unknown()),
  rotation_context: z.record(z.string(), z.unknown()),
  selloff_profile: z.record(z.string(), z.unknown()),
  derivatives: z.record(z.string(), z.unknown()),
  btc_crowding: z.record(z.string(), z.unknown()),
  okx: z.record(z.string(), z.unknown()),
  cross_exchange_top20: z.record(z.string(), z.unknown()),
  confirmations: z.record(z.string(), z.unknown()),
  interpretations: z.array(z.unknown()),
  history_1h: z.array(z.unknown()),
  cohorts: z.array(z.unknown()),
  top20: z.array(z.unknown()),
});

export type ParseResult =
  | { ok: true; data: CryptoBreadthPayload }
  | { ok: false; error: string };

export function parseBreadthPayload(json: unknown): ParseResult {
  const result = breadthPayloadSchema.safeParse(json);
  if (!result.success) {
    return { ok: false, error: result.error.issues.map((i) => i.message).join("; ") };
  }
  return { ok: true, data: json as CryptoBreadthPayload };
}
