import { parseBreadthPayload, type ParseResult } from "./schema";

const API_URL = process.env.CRYPTO_BREADTH_API_URL; // 例如 http://<VPS_IP>:8080
const TOKEN = process.env.CRYPTO_BREADTH_TOKEN;

/**
 * Python's default JSON encoder emits bare NaN/Infinity for non-finite
 * floating-point values. Browsers and JSON.parse reject those tokens even
 * though the HTTP response is labelled application/json. Treat only values
 * in JSON value position as missing; quoted strings such as "NaN" stay intact.
 */
export function parseSourceJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch (initialError) {
    const repaired = body.replace(
      /([\[{,:]\s*)(?:NaN|-?Infinity)(?=\s*[,}\]])/g,
      "$1null",
    );

    if (repaired === body) throw initialError;
    return JSON.parse(repaired);
  }
}

async function getMockBreadthData(): Promise<ParseResult> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    const file = path.join(process.cwd(), ".mock-data/crypto-breadth-sample.json");
    const raw = await fs.readFile(file, "utf-8");
    return parseBreadthPayload(JSON.parse(raw));
  } catch {
    return { ok: false, error: "本地 mock 数据不存在（.mock-data/crypto-breadth-sample.json）" };
  }
}

async function fetchBreadthDataOnce(): Promise<ParseResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/data.json`, {
      headers: { "X-Internal-Token": TOKEN! },
      // Do not persist a transient HTTP 200 error page in Next's data cache.
      // The VPS refreshes its source data every 15 minutes, so fresh reads here
      // are preferable to serving a cached malformed response for days.
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "数据源请求失败，VPS 可能暂时不可达" };
  }

  if (!res.ok) {
    return { ok: false, error: `数据源返回异常状态：${res.status}` };
  }

  let json: unknown;
  try {
    json = parseSourceJson(await res.text());
  } catch (error) {
    // The endpoint has historically returned an HTML error page with HTTP 200,
    // and跨境链路偶发丢包也会导致响应体不完整。Log only response metadata so
    // production diagnostics never expose data or credentials.
    console.error("Crypto breadth source returned invalid JSON", {
      status: res.status,
      contentType: res.headers.get("content-type"),
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      ok: false,
      error: "数据源响应格式异常（已记录诊断信息）",
    };
  }

  return parseBreadthPayload(json);
}

export async function getBreadthData(): Promise<ParseResult> {
  if (!API_URL || !TOKEN) {
    if (process.env.NODE_ENV === "development") {
      return getMockBreadthData();
    }
    return { ok: false, error: "服务端未配置 CRYPTO_BREADTH_API_URL / CRYPTO_BREADTH_TOKEN" };
  }

  const first = await fetchBreadthDataOnce();
  if (first.ok) return first;

  // 跨境网络链路偶发丢包/中断是已观测到的瞬时故障，重试一次即可恢复。
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return fetchBreadthDataOnce();
}
