const en = {
  nav: {
    home: "Home",
    projects: "Vibecoding Portfolio",
    blog: "Ideas & Notes",
    about: "About Me",
  },
  hero: {
    greeting: "Hey, I'm",
    roles: ["Product Thinker", "AI Builder"] as string[],
    description:
      "Welcome to my digital garden.\nA place for my thoughts and reflections.",
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
    subtitle: "From WeChat to Web3, building products people love.",
    viewLink: "View →",
  },
  projects: {
    homeTitle: "Vibecoding Portfolio",
    homeSubtitle: "AI, crypto, and developer tools I've built.",
    pageTitle: "Projects",
    pageSubtitle:
      "Things I've built — AI tools, crypto platforms, and developer utilities.",
    viewAll: "View all projects →",
    inProgress: "In Progress",
    dailyUpdate: "Daily Update",
    weeklyUpdate: "Weekly Update",
    latestOutput: "Latest Output",
    collapse: "Collapse ↑",
    expandAll: "Expand all ({count} sections) ↓",
    generatedAt: "Generated at",
    updatedAt: "Updated at",
    subscribeCTA: "Subscribe to Bot for daily briefing",
    recentVideos: "Recent Featured Videos",
    liveDemo: "Live Demo →",
    source: "Source →",
  },
  blog: {
    title: "Ideas & Notes",
    subtitle: "",
    readAll: "Read all posts →",
    noPosts: "Coming soon...",
    noPostsFiltered: "No posts yet. Coming soon...",
    backToAll: "← Back to all posts",
  },
  podcast: {
    title: "Podcast Notes",
    subtitle: "AI-powered notes from podcasts I listen to.",
    noNotes: "No podcast notes yet.",
    backToAll: "← Back to all podcast notes",
    newNote: "New Podcast Note",
    sourceLink: "Listen to original →",
    transcript: "Full Transcript",
  },
  contact: {
    title: "Let's Connect",
    subtitle:
      "Always open to interesting conversations and collaborations.",
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
    builtWith: "Built with Next.js & Framer Motion.",
  },
  common: {
    views: "views",
    langSwitch: "中",
  },
};

export default en;
export type Dictionary = typeof en;
