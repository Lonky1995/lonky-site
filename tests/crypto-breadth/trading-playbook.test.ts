import assert from "node:assert/strict";
import test from "node:test";
import { buildPlaybook } from "@/components/crypto/sections/TradingPlaybook";
import type { CryptoBreadthPayload } from "@/types/crypto-breadth";

function payload(states: CryptoBreadthPayload["states"]): CryptoBreadthPayload {
  return {
    states,
    intervals: {
      "15m": {} as CryptoBreadthPayload["intervals"]["15m"],
      "1h": { positive: 34, beat_btc: 42 } as CryptoBreadthPayload["intervals"]["1h"],
      "4h": {} as CryptoBreadthPayload["intervals"]["4h"],
    },
  } as CryptoBreadthPayload;
}

test("uses a defensive budget when the 4H market state is risk-off", () => {
  const playbook = buildPlaybook(payload({
    "15m": { label: "反弹", code: "positive", confidence: 60 },
    "1h": { label: "反弹", code: "positive", confidence: 60 },
    "4h": { label: "风险收缩", code: "risk-off", confidence: 80 },
  }));

  assert.equal(playbook.regime, "防守模式");
  assert.equal(playbook.riskBudget, "0–15% 常规风险");
});

test("requires 4H and 1H alignment before increasing the risk budget", () => {
  const aligned = buildPlaybook(payload({
    "15m": { label: "广度走强", code: "positive", confidence: 80 },
    "1h": { label: "广度走强", code: "positive", confidence: 80 },
    "4h": { label: "趋势走强", code: "strong", confidence: 80 },
  }));
  const conflicted = buildPlaybook(payload({
    "15m": { label: "山寨走强", code: "alt-rotation", confidence: 80 },
    "1h": { label: "过渡", code: "transition", confidence: 60 },
    "4h": { label: "分化", code: "fragmented", confidence: 80 },
  }));

  assert.equal(aligned.regime, "顺势扩张");
  assert.equal(conflicted.regime, "轻仓试错");
});
