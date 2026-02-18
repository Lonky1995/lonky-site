import { siteConfig } from "@/data/site-config";

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted">
          &copy; {new Date().getFullYear()} {siteConfig.name}. Built with
          Next.js & Framer Motion.
        </p>
        <div className="flex gap-6">
          <a
            href={siteConfig.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <a
            href={siteConfig.socials.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Twitter
          </a>
          <a
            href={siteConfig.socials.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Telegram
          </a>
        </div>
      </div>
    </footer>
  );
}
