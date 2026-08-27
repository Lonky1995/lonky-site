export interface ToolCard {
  id: string;
  title: string;
  description: string;
  href: string;
  tags: string[];
}

export const tools: ToolCard[] = [
  {
    id: "crypto-breadth",
    title: "加密货币市场广度",
    description: "追踪全市场状态、板块轮动、资金与杠杆确认信号、机构持仓拥挤度，以及 Top20 币种资金动量。每 15 分钟自动刷新。",
    href: "/crypto",
    tags: ["Crypto", "Dashboard"],
  },
  {
    id: "trading-analyzer",
    title: "交易风格分析器",
    description: "导入交易记录，AI 诊断你的交易风格、盈亏分布与行为偏差。",
    href: "/tools/trading-analyzer",
    tags: ["Trading", "AI"],
  },
];
