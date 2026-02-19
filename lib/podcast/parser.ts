import { parseXiaoyuzhou, type PodcastMeta } from "./parsers/xiaoyuzhou";
import { parseApplePodcasts } from "./parsers/apple";

export type { PodcastMeta };

export function detectPlatform(url: string): "xiaoyuzhou" | "apple" | "unknown" {
  if (/xiaoyuzhou\.me|xiaoyuzhoufm\.com|xyzcdn\.net/.test(url)) return "xiaoyuzhou";
  if (/podcasts\.apple\.com|itunes\.apple\.com/.test(url)) return "apple";
  return "unknown";
}

export async function parsePodcastUrl(url: string): Promise<PodcastMeta> {
  const platform = detectPlatform(url);

  switch (platform) {
    case "xiaoyuzhou":
      return parseXiaoyuzhou(url);
    case "apple":
      return parseApplePodcasts(url);
    default:
      throw new Error(
        `Unsupported podcast platform. Currently supports: 小宇宙 (xiaoyuzhou.me), Apple Podcasts (podcasts.apple.com)`
      );
  }
}
