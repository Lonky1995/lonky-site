import type { Metadata } from "next";
import CpoDashboard from "@/components/cpo/CpoDashboard";

export const metadata: Metadata = {
  title: "CPO / 光互联叙事看板",
  description:
    "追踪 CPO（共封装光学）单一叙事：技术采用曲线定位、BOM 卡位与 price-in、InP 供需缺口测算、标的打分、作战计划与风险场景。",
};

export default function CpoPage() {
  return (
    <>
      <div className="nebula-bg" />
      <CpoDashboard />
    </>
  );
}
