import { PodcastCreator } from "@/components/podcast/PodcastCreator";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

export const metadata = {
  title: "New Podcast Note",
  description: "Create a new AI-powered podcast note",
};

export default function NewPodcastNotePage() {
  return (
    <PageShell className="pb-24" narrow>
      <PageHeader eyebrow="Podcast" title="新建播客笔记" subtitle="贴链接，自动转录并生成结构化笔记" />
      <div data-reveal>
        <PodcastCreator />
      </div>
    </PageShell>
  );
}
