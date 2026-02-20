import { siteConfig } from "@/data/site-config";
import { readFile } from "fs/promises";
import { join } from "path";

const TWITTER_USERNAME = "ImLonky";

/**
 * Get the tweet ID to display.
 * 1. Try latest-tweet.json (auto-synced by OpenClaw host alert)
 * 2. Try env var TWEET_ID (updatable via Vercel dashboard without code change)
 * 3. Try syndication API for auto-latest (unreliable as of 2026)
 * 4. Fall back to featuredTweetId in site-config.ts
 */
export async function getLatestTweetId(): Promise<string> {
  // Priority 1: JSON file from automated sync
  const jsonId = await readTweetJson();
  if (jsonId) return jsonId;

  // Priority 2: Environment variable (easy update from Vercel dashboard)
  if (process.env.TWEET_ID) return process.env.TWEET_ID;

  // Priority 3: Try syndication API (best-effort auto-detection)
  const autoId = await fetchFromSyndication();
  if (autoId) return autoId;

  // Priority 4: Manual config fallback
  return siteConfig.featuredTweetId;
}

async function readTweetJson(): Promise<string | null> {
  try {
    const filePath = join(process.cwd(), "public", "data", "latest-tweet.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    if (data?.tweet_id && typeof data.tweet_id === "string") {
      return data.tweet_id;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchFromSyndication(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://syndication.twitter.com/srv/timeline-profile/screen-name/${TWITTER_USERNAME}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return null;

    const html = await res.text();

    const ids = new Set<string>();
    const patterns = [/data-tweet-id="(\d+)"/g, /\/status\/(\d+)/g];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        ids.add(match[1]);
      }
    }

    if (ids.size === 0) return null;

    const newest = [...ids].sort((a, b) =>
      BigInt(b) > BigInt(a) ? 1 : -1
    )[0];

    // Only use syndication result if it's newer than the configured fallback
    if (BigInt(newest) > BigInt(siteConfig.featuredTweetId)) {
      return newest;
    }

    return null;
  } catch {
    return null;
  }
}
