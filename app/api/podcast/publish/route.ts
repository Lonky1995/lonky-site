import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.PODCAST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug, contentBase64 } = await req.json();
    if (!slug || !contentBase64) {
      return NextResponse.json({ error: "slug and contentBase64 are required" }, { status: 400 });
    }

    const path = `content/podcast-notes/${slug}.md`;
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
    }

    const owner = "Lonky1995";
    const repo = "lonky-site";

    // Check if file already exists (to get SHA for update)
    let sha: string | undefined;
    try {
      const existing = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        { headers: { Authorization: `Bearer ${githubToken}` } }
      );
      if (existing.ok) {
        const data = await existing.json();
        sha = data.sha;
      }
    } catch {
      // File doesn't exist, that's fine
    }

    // Create or update file
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Add podcast note: ${slug}`,
          content: contentBase64,
          ...(sha ? { sha } : {}),
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `GitHub API error: ${res.status}`);
    }

    const result = await res.json();
    return NextResponse.json({
      url: result.content?.html_url,
      path: result.content?.path,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
