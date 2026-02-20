import { promises as fs } from "fs";
import path from "path";

interface WechatArticle {
  title: string;
  content: string;
  author: string;
  url: string;
  updated_at: string;
}

export async function getLatestWechatArticle(): Promise<WechatArticle | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "latest-wechat.json");
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as WechatArticle;
  } catch {
    return null;
  }
}
