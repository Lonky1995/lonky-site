import type { Metadata } from "next";
import { experiences, skills } from "@/data/experience";
import { Timeline } from "@/components/about/Timeline";
import { Section } from "@/components/ui/Section";
import { TechBadge } from "@/components/ui/TechBadge";

export const metadata: Metadata = {
  title: "About",
  description:
    "Product Manager turned Vibecoder. 5 years of PM experience, now building with AI.",
};

export default function AboutPage() {
  return (
    <>
      {/* Intro */}
      <Section title="About Me">
        <div className="max-w-2xl">
          <p className="mb-4 text-lg leading-relaxed text-muted">
            I&apos;m a product manager who learned to code with AI. After 5
            years of building products for others, I started building my own —
            combining product thinking with hands-on development.
          </p>
          <p className="mb-4 text-lg leading-relaxed text-muted">
            My toolkit includes{" "}
            <span className="text-foreground">Claude Code</span>,{" "}
            <span className="text-foreground">Next.js</span>, and{" "}
            <span className="text-foreground">Python</span>. I focus on AI
            applications, crypto trading tools, and productivity systems.
          </p>
          <p className="text-lg leading-relaxed text-muted">
            I maintain an Obsidian knowledge base with{" "}
            <span className="text-foreground">1,193 notes</span> — my second
            brain for product insights, technical learnings, and market research.
          </p>
        </div>
      </Section>

      {/* Timeline */}
      <Section title="Experience">
        <Timeline items={experiences} />
      </Section>

      {/* Skills */}
      <Section title="Skills & Tools">
        <div className="flex flex-wrap gap-3">
          {skills.map((skill) => (
            <TechBadge key={skill} label={skill} />
          ))}
        </div>
      </Section>
    </>
  );
}
