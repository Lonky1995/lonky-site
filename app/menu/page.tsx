import { MenuBoard } from "@/components/menu/MenuBoard";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

export const metadata = {
  title: "今日菜谱 | Lonky",
  description: "AI 为你家 6 口人设计的每日营养菜谱",
};

export default function MenuPage() {
  return (
    <PageShell className="pb-24">
      <PageHeader
        eyebrow="Menu"
        title="今日菜谱"
        subtitle="每天不再纠结吃什么 · AI 为全家设计营养均衡的菜谱"
      />
      <div data-reveal>
        <MenuBoard />
      </div>
    </PageShell>
  );
}
