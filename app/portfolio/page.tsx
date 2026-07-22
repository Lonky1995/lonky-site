import type { Metadata } from "next";
import PortfolioDashboard from "@/components/portfolio/PortfolioDashboard";

export const metadata: Metadata = {
  title: "美股监控台",
  description:
    "美股监控台：市场姿态、跨资产锚点、组合追踪、风险管理与事件日历，一屏掌握市场与持仓。",
};

export default function PortfolioPage() {
  return <PortfolioDashboard />;
}
