import type { Metadata } from "next";
import RadarDashboard from "@/components/radar/RadarDashboard";

export const metadata: Metadata = {
  title: "X 情报雷达 / Radar",
  description:
    "每天自动聚合近 48 小时 X/Twitter 高互动内容，用 AI 按领域分类：AI 大模型、Crypto、产品工程与当日热点。",
};

export default function RadarPage() {
  return <RadarDashboard />;
}
