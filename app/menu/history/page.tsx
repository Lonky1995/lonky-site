import Link from "next/link";
import { MenuHistory } from "@/components/menu/MenuHistory";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

export const metadata = {
  title: "菜谱历史 | Lonky",
  description: "过往生成的家庭菜谱记录",
};

export default function MenuHistoryPage() {
  return (
    <PageShell className="pb-24" narrow>
      <PageHeader
        eyebrow="Menu"
        title="菜谱历史"
        subtitle="过往菜谱 · 保存在你的浏览器本地"
        action={
          <Link href="/menu" className="secondary-button">
            ← 今日菜谱
          </Link>
        }
      />
      <div data-reveal>
        <MenuHistory />
      </div>
    </PageShell>
  );
}
