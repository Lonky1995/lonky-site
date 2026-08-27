import type { Metadata } from "next";
import { getBreadthData } from "@/lib/crypto-breadth/fetch";
import CryptoDashboard from "@/components/crypto/CryptoDashboard";

export const metadata: Metadata = {
  title: "加密货币市场广度看板",
  description:
    "追踪加密货币全市场广度：市场状态、板块轮动、资金与杠杆确认信号、机构持仓拥挤度，以及 Top20 币种资金动量。每 15 分钟自动刷新。",
};

export const revalidate = 300;

export default async function CryptoPage() {
  const result = await getBreadthData();

  return (
    <div className="apple-width pb-24 pt-10">
      <p className="apple-eyebrow">Crypto Market Breadth</p>
      <h1 className="apple-section-title" style={{ fontSize: "clamp(1.8rem, 3.6vw, 2.6rem)" }}>
        加密货币市场广度
      </h1>
      <p className="apple-muted mt-3 max-w-2xl">
        每 15 分钟从 Binance / OKX / CoinPaprika 抓取数据，计算市场状态、资金流向、机构持仓拥挤度与板块轮动信号。
      </p>

      <div className="mt-8">
        {result.ok ? (
          <CryptoDashboard data={result.data} />
        ) : (
          <div className="pf-panel" style={{ color: "rgba(245,247,251,0.6)" }}>
            数据暂不可用：{result.error}
          </div>
        )}
      </div>
    </div>
  );
}
