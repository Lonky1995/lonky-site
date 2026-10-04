import { Hero } from "@/components/home/Hero";
import { ProjectsPreview } from "@/components/home/ProjectsPreview";
import { CryptoEntry } from "@/components/home/CryptoEntry";
import { AboutTimeline } from "@/components/home/AboutTimeline";
import { ContactCTA } from "@/components/home/ContactCTA";
export default function Home() {
  return (
    <div className="lonky-home">
      <Hero />
      <ProjectsPreview />
      <CryptoEntry />
      <AboutTimeline />
      <ContactCTA />
    </div>
  );
}
