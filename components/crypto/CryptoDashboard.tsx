"use client";

import { useState } from "react";
import type { CryptoBreadthPayload } from "@/types/crypto-breadth";
import MarketPulseHero from "./sections/MarketPulseHero";
import InterpretationGrid from "./sections/InterpretationGrid";
import RotationAndSelloff from "./sections/RotationAndSelloff";
import CrowdingPanel from "./sections/CrowdingPanel";
import DerivativesConfirm from "./sections/DerivativesConfirm";
import CrossExchangePanel from "./sections/CrossExchangePanel";
import BreadthMatrix from "./sections/BreadthMatrix";
import CohortTable from "./sections/CohortTable";
import Top20Table from "./sections/Top20Table";
import SourceInfo from "./sections/SourceInfo";

const TABS = [
  { key: "summary", label: "概览" },
  { key: "structure", label: "市场结构" },
  { key: "capital", label: "资金杠杆" },
  { key: "coins", label: "币种状态" },
  { key: "sources", label: "数据说明" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function CryptoDashboard({ data }: { data: CryptoBreadthPayload }) {
  const [tab, setTab] = useState<TabKey>("summary");

  return (
    <div className="flex flex-col gap-6">
      <MarketPulseHero data={data} />

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="pf-chip"
            style={{
              cursor: "pointer",
              background: tab === t.key ? "rgba(168,180,255,0.16)" : undefined,
              borderColor: tab === t.key ? "rgba(168,180,255,0.5)" : undefined,
              color: tab === t.key ? "#a8b4ff" : undefined,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="flex flex-col gap-6">
          <RotationAndSelloff rotation={data.rotation_context} selloff={data.selloff_profile} />
          <InterpretationGrid items={data.interpretations} />
        </div>
      )}

      {tab === "structure" && (
        <div className="flex flex-col gap-6">
          <BreadthMatrix intervals={data.intervals} history={data.history_1h} />
          <CohortTable cohorts={data.cohorts} />
        </div>
      )}

      {tab === "capital" && (
        <div className="flex flex-col gap-6">
          <DerivativesConfirm derivatives={data.derivatives} confirmations={data.confirmations} />
          <CrowdingPanel data={data.btc_crowding} />
          <CrossExchangePanel crossExchange={data.cross_exchange_top20} okx={data.okx} />
        </div>
      )}

      {tab === "coins" && (
        <div className="flex flex-col gap-6">
          <Top20Table rows={data.top20} />
        </div>
      )}

      {tab === "sources" && (
        <div className="flex flex-col gap-6">
          <SourceInfo policy={data.threshold_policy} universe={data.universe} />
        </div>
      )}
    </div>
  );
}
