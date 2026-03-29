const en = {
  nav: {
    home: "Home",
    projects: "Vibecoding Portfolio",
    blog: "Ideas & Notes",
    about: "About Me",
  },
  hero: {
    greeting: "Hey, I'm",
    roles: ["Product Manager", "AI Builder", "Vibecoder"] as string[],
    description:
      "8 years in product — WeChat to OKX.\nNow building tools I actually want to use.",
    cards: {
      projects: {
        title: "Projects",
        description: "AI tools, crypto platforms, developer tools",
      },
      blog: {
        title: "Blog",
        description: "Product thinking, tech practices, build notes",
      },
      about: {
        title: "About",
        description: "PM to Builder journey",
      },
    },
  },
  aboutTimeline: {
    title: "About Me",
    subtitle: "8 years in product across social, content, and crypto. Now I build my own tools with AI.",
    viewLink: "Learn more →",
  },
  projects: {
    homeTitle: "Vibecoding Portfolio",
    homeSubtitle: "Zero coding background, all built with AI — from idea to production.",
    pageTitle: "Vibecoding Portfolio",
    pageSubtitle: "Zero coding background, all built with AI — from idea to production.",
    viewAll: "View all →",
    inProgress: "In Progress",
    dailyUpdate: "Daily Update",
    weeklyUpdate: "Weekly Update",
    latestOutput: "Latest Output",
    collapse: "Collapse ↑",
    expandAll: "Expand all ({count} sections) ↓",
    generatedAt: "Generated at",
    updatedAt: "Updated at",
    subscribeCTA: "Join Telegram channel for more content",
    recentVideos: "Recent Featured Videos",
    liveDemo: "Live Demo →",
    source: "Source →",
  },
  blog: {
    title: "Ideas & Notes",
    subtitle: "Product decisions, AI observations, and lessons from building.",
    readAll: "Read all →",
    noPosts: "Coming soon...",
    noPostsFiltered: "No posts yet. Coming soon...",
    backToAll: "← Back to all posts",
  },
  podcast: {
    title: "Podcast Notes",
    subtitle: "AI extracts the best parts — searchable, structured, ready to revisit.",
    noNotes: "No podcast notes yet.",
    backToAll: "← Back to all podcast notes",
    newNote: "Try it →",
    sourceLink: "Listen to original →",
    transcript: "Full Transcript",
  },
  contact: {
    title: "Say Hello",
    subtitle:
      "Product, AI, crypto — or just want to chat. I'm here.",
    latestOnX: "Latest on X",
    findMeOn: "Find me on",
    wechatCopied: "WeChat ID copied:",
    officialAccount: "Official Account",
    officialAccountAlt: "Official Account QR Code",
  },
  aboutPage: {
    title: "About Me",
    experience: "Experience",
    skills: "Skills & Tools",
    metaDescription:
      "Product Manager turned Vibecoder. 5 years of PM experience, now building with AI.",
  },
  footer: {
    builtWith: "Built with AI. Maintained at midnight.",
  },
  common: {
    views: "views",
    langSwitch: "中",
  },
};

export default en;
export type Dictionary = typeof en;
