import { parseBreadthPayload, type ParseResult } from "./schema";

const API_URL = process.env.CRYPTO_BREADTH_API_URL; // 例如 http://<VPS_IP>:8080
const TOKEN = process.env.CRYPTO_BREADTH_TOKEN;

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

export async function getBreadthData(): Promise<ParseResult> {
  if (!API_URL || !TOKEN) {
    if (process.env.NODE_ENV === "development") {
      return getMockBreadthData();
    }
    return { ok: false, error: "服务端未配置 CRYPTO_BREADTH_API_URL / CRYPTO_BREADTH_TOKEN" };
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/data.json`, {
      headers: { "X-Internal-Token": TOKEN },
      next: { revalidate: 300 },
    });
  } catch {
    return { ok: false, error: "数据源请求失败，VPS 可能暂时不可达" };
  }

  if (!res.ok) {
    return { ok: false, error: `数据源返回异常状态：${res.status}` };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, error: "数据源返回内容不是合法 JSON" };
  }

  return parseBreadthPayload(json);
}
