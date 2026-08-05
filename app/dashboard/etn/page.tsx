import type { Metadata } from "next";
import EtnDashboard from "@/components/etn/EtnDashboard";

export const metadata: Metadata = {
  title: "ETN 催化剂追踪看板",
  description:
    "追踪 Eaton（ETN）的催化剂路线图：Q2 业绩超预期、Mobility + Dana $100亿合并、NVIDIA Vera Rubin DSX 生态绑定，以及 Q3 利润率这个多空分水岭。含定价状态评估与监控清单。",
};

export default function EtnPage() {
  return (
    <div className="apple-width pb-24 pt-6">
      <EtnDashboard />
    </div>
  );
}
