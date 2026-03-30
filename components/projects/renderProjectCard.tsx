import type { projects } from "@/data/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { BriefingCard } from "@/components/projects/BriefingCard";
import { YouTubeCard } from "@/components/projects/YouTubeCard";
import { PodcastCard } from "@/components/projects/PodcastCard";
import { TradeMirrorCard } from "@/components/projects/TradeMirrorCard";
import { TgDigestCard } from "@/components/projects/TgDigestCard";
import { OAuthProxyCard } from "@/components/projects/OAuthProxyCard";
import { XKitCard } from "@/components/projects/XKitCard";

export function renderProjectCard(
  project: (typeof projects)[number],
  index: number,
) {
  switch (project.id) {
    case "crypto-briefing":
      return <BriefingCard key={project.id} project={project} index={index} />;
    case "youtube-ai":
      return <YouTubeCard key={project.id} project={project} index={index} />;
    case "podcast-notes":
      return <PodcastCard key={project.id} project={project} index={index} />;
    case "trade-style-analyzer":
      return (
        <TradeMirrorCard key={project.id} project={project} index={index} />
      );
    case "tg-channel-digest":
      return <TgDigestCard key={project.id} project={project} index={index} />;
    case "claude-oauth-proxy":
      return (
        <OAuthProxyCard key={project.id} project={project} index={index} />
      );
    case "x-kit":
      return <XKitCard key={project.id} project={project} index={index} />;
    default:
      return <ProjectCard key={project.id} project={project} index={index} />;
  }
}
