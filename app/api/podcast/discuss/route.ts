import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { NextRequest, NextResponse } from "next/server";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

const OWNER = "Lonky1995";
const REPO = "lonky-site";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  const path = `data/discussions/${slug}.json`;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
      {
        headers: { Authorization: `Bearer ${githubToken}` },
        next: { revalidate: 0 },
      }
    );

    if (res.status === 404) {
      return NextResponse.json([]);
    }

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return NextResponse.json(JSON.parse(content));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load discussions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { messages, system } = await req.json();

  // Basic guard: limit message count and size
  if (!Array.isArray(messages) || messages.length > 20) {
    return new Response("Too many messages", { status: 400 });
  }

  const result = streamText({
    model: deepseek.chatModel("deepseek-chat"),
    system,
    messages: messages.slice(-10), // keep last 10 messages for context window
  });

  return result.toTextStreamResponse();
}
