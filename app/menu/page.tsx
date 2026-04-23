import { Section } from "@/components/ui/Section";
import { MenuBoard } from "@/components/menu/MenuBoard";

export const metadata = {
  title: "今日菜谱 | Lonky",
  description: "AI 为你家 6 口人设计的每日营养菜谱",
};

export default function MenuPage() {
  return (
    <section className="px-5 pt-24 pb-16 sm:px-6 sm:pt-28 md:px-8 md:pt-32 md:pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 md:mb-16">
          <h2
            className="font-bold leading-[0.88] tracking-tight text-foreground uppercase"
            style={{ fontSize: "clamp(2.2rem, 12vw, 6rem)" }}
          >
            MENU
          </h2>
          <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-muted md:mt-5 md:text-base">
            每天不再纠结吃什么 · AI 为全家设计营养均衡的菜谱
          </p>
        </div>
        <MenuBoard />
      </div>
    </section>
  );
}
