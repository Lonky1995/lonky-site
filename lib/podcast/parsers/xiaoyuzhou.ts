export type PodcastMeta = {
  title: string;
  description: string;
  coverImage: string;
  audioUrl: string;
  platform: "xiaoyuzhou" | "apple";
  duration?: number;
};

export async function parseXiaoyuzhou(url: string): Promise<PodcastMeta> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch xiaoyuzhou page: ${res.status}`);

  const html = await res.text();

  const audioMatch = html.match(/https:\/\/media\.xyzcdn\.net\/[^"'\s]+\.(m4a|mp3)/);
  if (!audioMatch) throw new Error("Could not find audio URL in xiaoyuzhou page");

  const title = extractMeta(html, "og:title") || "Untitled Episode";
  const description = extractMeta(html, "og:description") || "";
  const coverImage = extractMeta(html, "og:image") || "";

  return {
    title,
    description,
    coverImage,
    audioUrl: audioMatch[0],
    platform: "xiaoyuzhou",
  };
}

function extractMeta(html: string, property: string): string {
  const re = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const match = html.match(re);
  if (match) return match[1];

  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`,
    "i"
  );
  const match2 = html.match(re2);
  return match2 ? match2[1] : "";
}
