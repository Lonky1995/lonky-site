import type { Metadata } from "next";
import MarketDashboard from "@/components/market/MarketDashboard";

export const metadata: Metadata = {
  title: "市场观察",
  description: "公开宏观市场观察：市场姿态、跨资产、资金流与拥挤度。",
};

export default function MarketPage() {
  return <MarketDashboard />;
}
