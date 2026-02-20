import { NextRequest, NextResponse } from "next/server";

const OWNER = "Lonky1995";
const REPO = "lonky-site";

type Discussion = {
  id: string;
  visitorId: string;
  question: string;
  answer: string;
  createdAt: string;
};

export async function POST(req: NextRequest) {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  const { slug, visitorId, question, answer } = await req.json();
  if (!slug || !visitorId || !question || !answer) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const path = `data/discussions/${slug}.json`;
  const maxRetries = 2;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Read existing file (if any)
      let existing: Discussion[] = [];
      let sha: string | undefined;

      const getRes = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
        { headers: { Authorization: `Bearer ${githubToken}` } }
      );

      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        existing = JSON.parse(content);
      } else if (getRes.status !== 404) {
        throw new Error(`GitHub read error: ${getRes.status}`);
      }

      // Server-side check: has this visitor already asked?
      if (existing.some((d) => d.visitorId === visitorId)) {
        return NextResponse.json({ error: "Already participated" }, { status: 409 });
      }

      // Append new discussion
      const newThread: Discussion = {
        id: crypto.randomUUID(),
        visitorId,
        question,
        answer,
        createdAt: new Date().toISOString(),
      };
      existing.push(newThread);

      // Write back to GitHub
      const putRes = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Add discussion to ${slug}`,
            content: Buffer.from(JSON.stringify(existing, null, 2)).toString("base64"),
            ...(sha ? { sha } : {}),
          }),
        }
      );

      if (putRes.ok) {
        return NextResponse.json(newThread);
      }

      // 409 = SHA conflict, retry
      if (putRes.status === 409 && attempt < maxRetries - 1) {
        continue;
      }

      const err = await putRes.json();
      throw new Error(err.message || `GitHub write error: ${putRes.status}`);
    } catch (e) {
      if (attempt < maxRetries - 1) continue;
      const message = e instanceof Error ? e.message : "Save failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Save failed after retries" }, { status: 500 });
}
