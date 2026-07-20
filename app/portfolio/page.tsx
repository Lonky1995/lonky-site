import type { Metadata } from "next";
import PortfolioDashboard from "@/components/portfolio/PortfolioDashboard";

export const metadata: Metadata = {
  title: "组合追踪器",
  description:
    "手动更新的仓位追踪：开仓逻辑、验证信号、证伪信号，配合每周关注清单——过滤噪音，只提醒和持仓真正相关的事。",
};

export default function PortfolioPage() {
  return <PortfolioDashboard />;
}
