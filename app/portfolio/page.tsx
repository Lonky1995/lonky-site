import type { Metadata } from "next";
import PublicPortfolio from "@/components/portfolio/PublicPortfolio";

export const metadata: Metadata = {
  title: "公开持仓",
  description: "Lonky 的公开持仓、开仓逻辑与验证条件。",
};

export default function PortfolioPage() {
  return <PublicPortfolio />;
}
