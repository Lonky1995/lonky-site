import type { Metadata } from "next";
import RadarDashboard from "@/components/radar/RadarDashboard";

export const metadata: Metadata = {
  title: "X 情报雷达 / Radar",
  description:
    "AI 每天从近 48 小时 X/Twitter 关注流里筛出真正重要的信号——重大事件、独到观点、热门讨论，滤掉噪音。",
};

export default function RadarPage() {
  return <RadarDashboard />;
}
