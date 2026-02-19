import { siteConfig } from "@/data/site-config";

const TWITTER_USERNAME = "ImLonky";

/**
 * Get the tweet ID to display.
 * 1. Try env var TWEET_ID (updatable via Vercel dashboard without code change)
 * 2. Try syndication API for auto-latest (unreliable as of 2026)
 * 3. Fall back to featuredTweetId in site-config.ts
 */
export async function getLatestTweetId(): Promise<string> {
  // Priority 1: Environment variable (easy update from Vercel dashboard)
  if (process.env.TWEET_ID) return process.env.TWEET_ID;

  // Priority 2: Try syndication API (best-effort auto-detection)
  const autoId = await fetchFromSyndication();
  if (autoId) return autoId;

  // Priority 3: Manual config fallback
  return siteConfig.featuredTweetId;
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
