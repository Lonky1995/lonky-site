import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.PODCAST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const transcript = await client.transcripts.get(id);

    return NextResponse.json({
      status: transcript.status,
      text: transcript.status === "completed" ? transcript.text : undefined,
      error: transcript.status === "error" ? transcript.error : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
