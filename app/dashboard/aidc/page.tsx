import type { Metadata } from "next";
import AidcDashboard from "@/components/aidc/AidcDashboard";

export const metadata: Metadata = {
  title: "AI Datacenter 产业链看板",
  description:
    "追踪 AI 数据中心产业链：光互联/CPO 与电力基础设施两条主线的叙事、资金流向、四铁律评分与标的信号。",
};

export default function AidcPage() {
  return (
    <>
      <div className="nebula-bg" />
      <AidcDashboard />
    </>
  );
}
