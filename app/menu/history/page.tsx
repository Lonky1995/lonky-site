import Link from "next/link";
import { MenuHistory } from "@/components/menu/MenuHistory";

export const metadata = {
  title: "菜谱历史 | Lonky",
  description: "过往生成的家庭菜谱记录",
};

export default function MenuHistoryPage() {
  return (
    <section className="px-5 pt-24 pb-16 sm:px-6 sm:pt-28 md:px-8 md:pt-32 md:pb-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 md:mb-12">
          <Link
            href="/menu"
            className="text-xs text-muted underline underline-offset-4 hover:text-accent sm:text-sm"
          >
            ← 返回今日菜谱
          </Link>
          <h2
            className="mt-4 font-bold leading-[0.88] tracking-tight text-foreground uppercase"
            style={{ fontSize: "clamp(2rem, 10vw, 5rem)" }}
          >
            HISTORY
          </h2>
          <p className="mt-3 text-sm font-light leading-relaxed text-muted md:text-base">
            过往菜谱 · 保存在你的浏览器本地
          </p>
        </div>
        <MenuHistory />
      </div>
    </section>
  );
}
