import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/podcast/auth";
import {
  hasPosted,
  normalizeStoredDiscussions,
  toDiscussionView,
  type StoredDiscussion,
} from "@/lib/podcast/discussions";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

const OWNER = "Lonky1995";
const REPO = "lonky-site";

async function loadStoredDiscussions(
  slug: string,
  githubToken: string
): Promise<StoredDiscussion[]> {
  const path = `data/discussions/${slug}.json`;
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      headers: { Authorization: `Bearer ${githubToken}` },
      next: { revalidate: 0 },
    }
  );

  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return normalizeStoredDiscussions(JSON.parse(content));
}

export async function GET(req: NextRequest) {
  const session = await auth(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  try {
    const discussions = await loadStoredDiscussions(slug, githubToken);
    const alreadyParticipated = hasPosted(discussions, session.user.id);
    return NextResponse.json({
      currentUser: {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
      },
      canPost: !alreadyParticipated,
      alreadyParticipated,
      discussions: discussions.map((item) => toDiscussionView(item, session.user)),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load discussions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth(req);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, system } = await req.json();

  // Basic guard: limit message count and size
  if (!Array.isArray(messages) || messages.length > 20 || typeof system !== "string") {
    return new Response("Too many messages", { status: 400 });
  }

  const result = streamText({
    model: deepseek.chatModel("deepseek-chat"),
    system,
    messages: messages.slice(-10), // keep last 10 messages for context window
  });

  return result.toTextStreamResponse();
}
