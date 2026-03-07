import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { NextRequest } from "next/server";
import { auth } from "@/lib/podcast/auth";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

export async function POST(req: NextRequest) {
  const session = await auth(req);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, system } = await req.json();

  const result = streamText({
    model: deepseek.chatModel("deepseek-chat"),
    system,
    messages,
  });

  return result.toTextStreamResponse();
}
