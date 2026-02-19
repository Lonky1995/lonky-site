import { XMLParser } from "fast-xml-parser";
import type { PodcastMeta } from "./xiaoyuzhou";

export async function parseApplePodcasts(url: string): Promise<PodcastMeta> {
  // Extract podcast ID and episode param from URL
  // e.g. https://podcasts.apple.com/cn/podcast/xxx/id1234567890?i=1000123456789
  const podcastIdMatch = url.match(/\/id(\d+)/);
  if (!podcastIdMatch) throw new Error("Could not extract podcast ID from Apple Podcasts URL");

  const podcastId = podcastIdMatch[1];
  const episodeParam = new URL(url).searchParams.get("i");

  // Get RSS feed URL via iTunes Lookup API
  const lookupRes = await fetch(
    `https://itunes.apple.com/lookup?id=${podcastId}&entity=podcast`
  );
  if (!lookupRes.ok) throw new Error(`iTunes lookup failed: ${lookupRes.status}`);

  const lookupData = await lookupRes.json();
  const feedUrl = lookupData.results?.[0]?.feedUrl;
  if (!feedUrl) throw new Error("Could not find RSS feed URL");

  const podcastName = lookupData.results?.[0]?.collectionName || "";
  const podcastCover = lookupData.results?.[0]?.artworkUrl600 || "";

  // Fetch and parse RSS feed
  const rssRes = await fetch(feedUrl);
  if (!rssRes.ok) throw new Error(`Failed to fetch RSS feed: ${rssRes.status}`);

  const rssText = await rssRes.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const feed = parser.parse(rssText);

  const items = feed?.rss?.channel?.item;
  if (!items || !Array.isArray(items)) throw new Error("No episodes found in RSS feed");

  // Find the specific episode
  let episode: Record<string, unknown> | undefined;

  if (episodeParam) {
    // Try to match by guid or episode number
    episode = items.find((item: Record<string, unknown>) => {
      const guid = typeof item.guid === "object"
        ? (item.guid as Record<string, string>)["#text"]
        : String(item.guid || "");
      return guid.includes(episodeParam);
    });
  }

  // Fallback: use first episode
  if (!episode) episode = items[0];
  if (!episode) throw new Error("No episode found in RSS feed");

  const enclosure = episode.enclosure as Record<string, string> | undefined;
  const audioUrl = enclosure?.["@_url"];
  if (!audioUrl) throw new Error("Could not find audio URL in RSS episode");

  const title = String(episode.title || podcastName);
  const description = String(
    episode["itunes:summary"] || episode.description || ""
  ).replace(/<[^>]*>/g, "");
  const coverImage =
    (episode["itunes:image"] as Record<string, string>)?.["@_href"] || podcastCover;
  const durationRaw = String(episode["itunes:duration"] || "");
  const duration = parseDuration(durationRaw);

  return {
    title,
    description: description.slice(0, 500),
    coverImage,
    audioUrl,
    platform: "apple",
    duration,
  };
}

function parseDuration(raw: string): number | undefined {
  if (!raw) return undefined;
  // Could be seconds (e.g. "3600") or HH:MM:SS / MM:SS
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const parts = raw.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return undefined;
}
