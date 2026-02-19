import { PodcastCreator } from "@/components/podcast/PodcastCreator";

export const metadata = {
  title: "New Podcast Note",
  description: "Create a new AI-powered podcast note",
};

const steps = [
  {
    icon: "🔗",
    title: "贴入链接",
    desc: "粘贴小宇宙 / Apple Podcasts 链接",
  },
  {
    icon: "🎙️",
    title: "自动转录",
    desc: "AI 语音识别，生成完整文字稿",
  },
  {
    icon: "📝",
    title: "结构化笔记",
    desc: "AI 提炼要点，生成结构化笔记",
  },
  {
    icon: "💬",
    title: "深入讨论",
    desc: "基于内容与 AI 对话，追问细节，激发思考",
  },
  {
    icon: "🚀",
    title: "一键生成",
    desc: "生成带有讨论的播客笔记，方便回顾",
  },
];

export default function NewPodcastNotePage() {
  return (
    <div className="min-h-screen px-6 py-20 md:px-8">
      <div className="mx-auto max-w-3xl">
        <PodcastCreator />
      </div>

      {/* How it works */}
      <div className="mx-auto mt-24 max-w-4xl">
        <h2 className="mb-12 text-center text-2xl font-bold">
          <span className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
            How it works
          </span>
        </h2>

        {/* Flow steps */}
        <div className="relative flex flex-col items-center gap-0 md:flex-row md:items-start md:justify-between md:gap-0">
          {/* Connecting line (desktop) */}
          <div className="absolute left-[10%] right-[10%] top-8 hidden h-px bg-gradient-to-r from-transparent via-[#6366f1]/30 to-transparent md:block" />

          {/* Connecting line (mobile) */}
          <div className="absolute bottom-0 left-8 top-0 w-px bg-gradient-to-b from-transparent via-[#6366f1]/30 to-transparent md:hidden" />

          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative z-10 flex items-start gap-4 py-4 md:flex-col md:items-center md:gap-0 md:py-0"
              style={{ flex: 1 }}
            >
              {/* Icon circle */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#1e293b] bg-[#111827] text-2xl shadow-lg shadow-[#6366f1]/5">
                {step.icon}
              </div>

              {/* Text */}
              <div className="md:mt-4 md:text-center">
                <p className="text-sm font-semibold text-[#f1f5f9]">
                  {step.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#94a3b8] md:max-w-[120px]">
                  {step.desc}
                </p>
              </div>

              {/* Arrow between steps (desktop) */}
              {i < steps.length - 1 && (
                <svg
                  className="absolute -right-3 top-7 hidden h-4 w-4 text-[#6366f1]/40 md:block"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M6 3l5 5-5 5V3z" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
