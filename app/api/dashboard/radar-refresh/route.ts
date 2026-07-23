import { NextResponse } from "next/server";

// 手动刷新 X 情报雷达：触发 VPS gateway 重新抓取 + AI 筛选，完成后网站数据会更新。
// gateway 侧 /api/jobs/run/* 已加 JOBS_RUN_TOKEN 鉴权，这里持有 token（服务端环境变量，不下发到浏览器）。

const GATEWAY_URL = process.env.LONKYCLAW_GATEWAY_URL; // 例如 http://<VPS_IP>:18800
const JOBS_RUN_TOKEN = process.env.JOBS_RUN_TOKEN;
const JOB_NAME = "radar-briefing-12h";
const COOLDOWN_MS = 60_000; // 60 秒内只允许触发一次，防误触/滥用

let lastTriggeredAt = 0;

export async function POST() {
  if (!GATEWAY_URL || !JOBS_RUN_TOKEN) {
    return NextResponse.json({ error: "服务端未配置 LONKYCLAW_GATEWAY_URL / JOBS_RUN_TOKEN" }, { status: 500 });
  }

  const now = Date.now();
  const remain = COOLDOWN_MS - (now - lastTriggeredAt);
  if (remain > 0) {
    return NextResponse.json({ error: `请稍等 ${Math.ceil(remain / 1000)} 秒再试` }, { status: 429 });
  }
  lastTriggeredAt = now;

  try {
    const res = await fetch(
      `${GATEWAY_URL}/api/jobs/run/${JOB_NAME}?token=${encodeURIComponent(JOBS_RUN_TOKEN)}`,
      { method: "GET", signal: AbortSignal.timeout(60_000) },
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: body?.error || `gateway ${res.status}` }, { status: 502 });
    }
    return NextResponse.json({ ok: true, result: body });
  } catch (e) {
    const message = e instanceof Error ? e.message : "触发失败";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
