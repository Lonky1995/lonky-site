import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.PODCAST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { audioUrl } = await req.json();
    if (!audioUrl || typeof audioUrl !== "string") {
      return NextResponse.json({ error: "audioUrl is required" }, { status: 400 });
    }

    // Check recent transcripts for the same audio URL (avoid duplicate submissions)
    const { transcripts: recent } = await client.transcripts.list({ limit: 20 });
    const existing = recent
      ?.filter((t) => t.audio_url === audioUrl)
      .sort((a, b) => new Date(b.created!).getTime() - new Date(a.created!).getTime());

    if (existing?.length) {
      // Prefer completed, then processing/queued
      const completed = existing.find((t) => t.status === "completed");
      if (completed) {
        return NextResponse.json({
          transcriptId: completed.id,
          status: completed.status,
          cached: true,
        });
      }
      const inProgress = existing.find((t) => t.status === "processing" || t.status === "queued");
      if (inProgress) {
        return NextResponse.json({
          transcriptId: inProgress.id,
          status: inProgress.status,
          cached: true,
        });
      }
    }

    const transcript = await client.transcripts.submit({
      audio_url: audioUrl,
      language_code: "zh",
      speech_models: ["universal-3-pro", "universal-2"],
    } as Parameters<typeof client.transcripts.submit>[0]);

    return NextResponse.json({
      transcriptId: transcript.id,
      status: transcript.status,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Transcribe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
