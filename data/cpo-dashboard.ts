// CPO / 光互联叙事看板 — 静态研究数据
// 内容来源：Obsidian vault CPO 研究笔记（框架 2026-06-27、深挖 2026-06-28、林姐方法论套用 2026-07-02）
// 更新方式：改这个文件 → push main → Vercel 自动部署

export const LAST_UPDATED = "2026-07-12";

// ── 1. 叙事定位 ────────────────────────────────────
export const narrative = {
  oneLiner:
    "CPO（共封装光学）= 把光引擎和交换机 ASIC 封装进同一个 Package。AI 数据中心规模扩大后，传统可插拔光模块的功耗和带宽已到物理极限——CPO 消除电-光转换距离，是下一代互连的必经之路。",
  market: { now: "$91M", future: "$1.9B", cagr: "35%", note: "2025 → 2035E，现在极小但增速极快" },
  // 赛道级四铁律（0-5 星）
  laws: [
    { name: "瓶颈", stars: 5, basis: "InP 激光器扩产 18-24 个月；6 英寸切换需新产线；COHR Q1 已 supply-limited" },
    { name: "垄断", stars: 4, basis: "InP 规模玩家 = COHR + LITE 二人转；Glass Bridge = GLW 独占；硅光平台三家" },
    { name: "库存弹性", stars: 4, basis: "COHR 毛利率 30.9%→35.4%（+4.5pct），量产 CPO 有望 40%+；数据中心客户价格不敏感" },
    { name: "扩产PTSD", stars: 3, basis: "光通信刚经历 2022-24 库存低谷（LITE 连续三年营业利润率为负），管理层用词保守" },
  ],
  lawsVerdict: "赛道过关，可下注——但不是所有标的都同时满足四条，按环节筛（见 04）",
  // 技术采用四阶段（历史规律：HBM、CoWoS、400G 光模块都走过）
  adoption: [
    { stage: "① 技术发布期", window: "0-6 个月", desc: "概念炒作，无收入，波动剧烈", current: true },
    { stage: "死亡谷", window: "2026Q4-2027Q1（预计）", desc: "商业化慢于预期，回调 -30%~-50% —— 最佳建仓窗口", current: false, danger: true },
    { stage: "② 客户验证期", window: "6-18 个月", desc: "小批量试用、设计赢单公告，横盘为主", current: false },
    { stage: "③ 收入兑现期", window: "18-36 个月", desc: "财报出现具体收入数字 → 主升浪、估值重构", current: false },
    { stage: "④ 渗透率定价期", window: "3-5 年", desc: "渗透率 5%→30%+，警惕估值泡沫", current: false },
  ],
  timeline: [
    { date: "2026-06-24", event: "Corning 首尔发布 Glass Bridge 玻璃波导互连组件（本叙事触发事件），搭配 GFS 硅光平台 V 型槽" },
    { date: "2026-06-27", event: "COHR Q1 出现 supply-limited 信号（需求 > 产能）；计划一年内 InP 产能翻倍（Sherman + Järfälla）" },
    { date: "2026-06-28", event: "估值修正：LITE $70→$850（12 倍）远超分析师中位目标 $339，判定过度定价；COHR 重回核心标的" },
    { date: "2026-07-02", event: "全线大跌（COHR -6.6% / LITE -6.6% / GLW -13.6% / AXTI -9.8%）——判定为死亡谷序幕，不是买入信号" },
  ],
};

// ── 2. 产业链卡位（BOM 分层）──────────────────────
export type BomLayer = {
  layer: string;
  segment: string;
  tickers: string[];
  replaceability: "极低" | "低" | "中";
  priceIn: 0 | 1 | 2 | 3; // 0=几乎未定价 1=部分定价 2=充分定价 3=过度定价
  note: string;
  key?: boolean; // 关键卡脖子层
};

export const PRICE_IN_LABELS = ["几乎未定价", "部分定价", "充分定价", "过度定价"] as const;

export const bomLayers: BomLayer[] = [
  {
    layer: "L1",
    segment: "Switch ASIC 设计/制造",
    tickers: ["MRVL", "AVGO", "TSM"],
    replaceability: "低",
    priceIn: 2,
    note: "MRVL Teralynx 是需求端最强确认信号，但 CPO 收入 2028H2 才来；TSMC CoWoS 唯一选择",
  },
  {
    layer: "L2a",
    segment: "硅光 PIC 代工",
    tickers: ["GFS", "INTC"],
    replaceability: "中",
    priceIn: 0,
    note: "GFS 是唯一公开绑定 Glass Bridge 的硅光平台（V 型槽适配 30μm 间距），市场当普通代工厂定价",
    key: true,
  },
  {
    layer: "L2b",
    segment: "InP 激光器 / ELS",
    tickers: ["COHR", "LITE"],
    replaceability: "极低",
    priceIn: 1,
    note: "最关键卡脖子项：每台 51.2T CPO 交换机约需 256 颗，物理上无法用硅替代；COHR 垂直整合最深（外延→激光器→调制器→硅光→模组全栈）",
    key: true,
  },
  {
    layer: "L3",
    segment: "Glass Bridge 光学连接",
    tickers: ["GLW"],
    replaceability: "极低",
    priceIn: 1,
    note: "GLW 独占（离子交换玻璃晶圆，耦合损耗 <2dB）；但市值 $190B，CPO 弹性被稀释",
    key: true,
  },
  {
    layer: "L0",
    segment: "InP 衬底（上游材料）",
    tickers: ["AXTI"],
    replaceability: "低",
    priceIn: 3,
    note: "小玩家、无定价权、收入还在跌（-11% YoY），却被情绪推到 34x P/S——长期空头候选",
  },
  {
    layer: "L4-5",
    segment: "封装基板 / 先进封装",
    tickers: ["BESI", "AMKR"],
    replaceability: "中",
    priceIn: 1,
    note: "过渡期 ABF（味之素）→ 玻璃基板（GLW 原片 + LRCX/AMAT 设备）；混合键合设备 BESI",
  },
];

// ── 3. 供需缺口测算（InP 激光器）──────────────────
export const supplyDemand = {
  subject: "InP 激光器（核心 BOM，单颗价值最高）",
  demandSide: [
    { label: "每台 51.2T CPO 交换机", value: "≈256 颗" },
    { label: "2027E 全球 CPO 交换机出货（业界共识）", value: "5-10 万台" },
    { label: "CPO 年增量需求", value: "≈1,900 万颗" },
    { label: "传统光通信年需求", value: "4,000-5,000 万颗" },
    { label: "CPO 增量占现有市场", value: "40-50%" },
  ],
  supplySide: [
    { label: "COHR + LITE 双寡头产能上限（估算）", value: "6,000-7,000 万颗/年" },
    { label: "COHR 扩产计划", value: "一年内产能翻倍 + 6 英寸切换成本降 50%" },
    { label: "扩产周期", value: "18-24 个月，2027 年前无法完全释放" },
  ],
  scenarios: [
    {
      name: "乐观情景",
      assumption: "2027 CPO 出货 7.5 万台",
      math: "需求 6,900 万 vs 供给 6,500-7,500 万",
      result: "紧平衡到轻度短缺",
      good: true,
    },
    {
      name: "悲观情景",
      assumption: "2027 CPO 只出 3 万台",
      math: "需求 5,750 万 vs 供给 7,000 万",
      result: "约 20% 过剩",
      good: false,
    },
  ],
  conclusion:
    "尾部风险偏乐观：只要 CPO 交换机出货 > 5 万台/年，COHR 就是绝对赢家。这个门槛不难达到——MRVL/AVGO/NVDA 都在推。",
};

// ── 4. 标的打分（四铁律 /20 分）────────────────────
export type ScoredTicker = {
  ticker: string;
  segment: string;
  scores: { bottleneck: number; monopoly: number; elasticity: number; ptsd: number };
  total: number;
  role: "主仓" | "空头" | "备选" | "观察" | "排除";
  verdict: string;
  reconsider?: string; // 何时重新考虑（排除标的）
};

export const scoredTickers: ScoredTicker[] = [
  {
    ticker: "COHR",
    segment: "InP 激光器",
    scores: { bottleneck: 5, monopoly: 4, elasticity: 5, ptsd: 3 },
    total: 17,
    role: "主仓",
    verdict: "唯一四铁律都强的标的：垂直整合全栈受益 + supply-limited + 毛利率跳升拐点，估值中性偏合理（10x P/S）",
  },
  {
    ticker: "GLW",
    segment: "Glass Bridge",
    scores: { bottleneck: 4, monopoly: 5, elasticity: 2, ptsd: 3 },
    total: 14,
    role: "观察",
    verdict: "Glass Bridge 独占但市值 $190B，CPO 弹性被大盘股体量稀释",
  },
  {
    ticker: "AVGO",
    segment: "Switch ASIC",
    scores: { bottleneck: 3, monopoly: 4, elasticity: 4, ptsd: 3 },
    total: 14,
    role: "排除",
    verdict: "CPO 只是众多受益点之一，弹性被稀释",
    reconsider: "CPO ASIC 单独披露收入",
  },
  {
    ticker: "NVDA",
    segment: "GPU + 生态",
    scores: { bottleneck: 3, monopoly: 5, elasticity: 5, ptsd: 3 },
    total: 16,
    role: "排除",
    verdict: "主叙事已 price-in，估值透支",
    reconsider: "单日暴跌 -20% 以上",
  },
  {
    ticker: "GFS",
    segment: "硅光代工",
    scores: { bottleneck: 4, monopoly: 3, elasticity: 3, ptsd: 3 },
    total: 13,
    role: "备选",
    verdict: "估值锚（6.2x P/S，CPO 溢价完全未进入）；等硅光收入信号触发再进",
  },
  {
    ticker: "LITE",
    segment: "InP 激光器",
    scores: { bottleneck: 5, monopoly: 4, elasticity: 2, ptsd: 2 },
    total: 13,
    role: "空头",
    verdict: "39x P/S 极度过度定价（分析师中位目标 $339）；与 COHR 的 4 分差距全在估值——同环节多 COHR 空 LITE 是天然对冲",
  },
  {
    ticker: "MRVL",
    segment: "Switch ASIC",
    scores: { bottleneck: 3, monopoly: 3, elasticity: 3, ptsd: 3 },
    total: 12,
    role: "排除",
    verdict: "CPO 是主叙事但收入 2028H2 才来，估值已拉伸",
    reconsider: "股价回到 $60 以下",
  },
  {
    ticker: "AXTI",
    segment: "InP 衬底",
    scores: { bottleneck: 3, monopoly: 2, elasticity: 1, ptsd: 2 },
    total: 8,
    role: "排除",
    verdict: "收入 -11% YoY 基本面不支撑，被情绪推到 34x P/S——长期空头候选",
    reconsider: "拿到 NVDA/大客户 LTA",
  },
];

// ── 5. 作战计划 ────────────────────────────────────
export type PlanTier = {
  label: string;
  triggerLow?: number; // 触发价区间（做多：<= 高值进入；做空：>= 低值进入）
  triggerHigh?: number;
  signal: string;
  size: string;
  cumulative?: string;
};

export const battlePlans: {
  ticker: string;
  direction: "多" | "空";
  allocation: string;
  logic: string;
  tiers: PlanTier[];
  exits: string[];
}[] = [
  {
    ticker: "COHR",
    direction: "多",
    allocation: "主仓，分 4 档建到 20%（激进上限）",
    logic: "InP 供应约束 + 垂直整合 + 毛利率跳升拐点 + FY26-27 CPO 收入兑现；利用死亡谷分批建仓",
    tiers: [
      { label: "观察建仓", triggerLow: 340, triggerHigh: 360, signal: "跌破 $370", size: "3%", cumulative: "3%" },
      { label: "第一浪回调", triggerLow: 300, triggerHigh: 320, signal: "未来 2-3 个月回撤 15-20%", size: "5%", cumulative: "8%" },
      { label: "死亡谷底", triggerLow: 250, triggerHigh: 280, signal: "2026Q4-2027Q1 回撤 30%+ 且财报 miss", size: "8%", cumulative: "16%" },
      { label: "CPO 收入确认", signal: "财报首次单独披露 CPO/ELS 收入（任何价）", size: "4%", cumulative: "20%" },
    ],
    exits: [
      "毛利率连续 2 个季度 <30%（库存弹性论证破裂）",
      "MRVL/AVGO 推迟 CPO guidance（需求端信号衰减）",
      "COHR 大幅扩产但价格不涨（供过于求，PTSD 消退）",
      "3 年内翻 3 倍且 P/S >20x（兑现离场）",
    ],
  },
  {
    ticker: "LITE",
    direction: "空",
    allocation: "对冲增强，分 3 档建到 8%（非主策略）",
    logic: "39x P/S vs 同业 COHR 10x；Spectrum-X 点名叙事已完全 price-in，技术护城河比 COHR 浅；估值套利不依赖 CPO 兑现——最短可执行机会",
    tiers: [
      { label: "首次建仓", triggerLow: 780, triggerHigh: 820, signal: "现价附近（$801 时判定）", size: "3%" },
      { label: "加仓", triggerLow: 850, triggerHigh: 900, signal: "短期反弹", size: "3%" },
      { label: "重仓", triggerLow: 950, signal: "再冲高（V 形反转前夜）", size: "2%" },
    ],
    exits: [
      "回到 $400（接近分析师中位 $339）→ 部分止盈",
      "回到 $300 以下 → 全部平仓",
      "LITE 拿下 MRVL/AVGO 独家 CPO 订单 → 立即止损（叙事变化）",
    ],
  },
  {
    ticker: "GFS",
    direction: "多",
    allocation: "备用配置 5-10%，当前不满足触发条件",
    logic: "硅光代工估值锚；Glass Bridge 量产接近时 GFS 是唯一公开绑定的硅光平台",
    tiers: [
      { label: "触发后建仓", triggerLow: 65, triggerHigh: 70, signal: "满足全部三条：硅光收入连续 2 季 +30% / 电话会提量产认证 / GLW 确认 Glass Bridge 收入", size: "5-10%" },
    ],
    exits: ["止损 $55（-15%）", "目标 $110（+50%）"],
  },
];

// ── 6. 信号与节点 ──────────────────────────────────
export const alphaChain = [
  { observe: "TSMC 加订 ASML/KLA", infer: "GLW/GFS 硅光订单跟进", lag: "1-2 季度" },
  { observe: "GLW 光纤扩产公告", infer: "Glass Bridge 量产临近", lag: "2-3 季度" },
  { observe: "MRVL Teralynx 出货", infer: "COHR/LITE InP 收入爆发", lag: "1-2 季度" },
  { observe: "COHR 6 英寸 InP 产线 ready", infer: "CPO 交换机大规模出货", lag: "3-4 季度" },
  { observe: "云厂商 AI Capex YoY 加速", infer: "整条产业链再上一台阶", lag: "同季度" },
];

export const keyMilestones = [
  { when: "2026 Q4", what: "GLW / GFS / COHR 财报 → 判断死亡谷深度", role: "建仓节奏依据" },
  { when: "2027 Q2-Q3", what: "MRVL Teralynx CPO ASIC 首次出货", role: "需求端最强确认信号" },
  { when: "2027 Q4", what: "COHR CPO 收入首次单独披露", role: "主升浪起点" },
];

export const earningsCalendar = [
  { ticker: "GLW", months: "1 / 4 / 7 / 10 月底", watch: "Optical Communications 分部；Glass Bridge 从「产品」变「收入贡献」的措辞" },
  { ticker: "GFS", months: "1 / 4 / 7 / 10 月底", watch: "Silicon Photonics 收入增速（连续 2 季 >30% = 触发）；CPO 相关 LTA" },
  { ticker: "COHR", months: "2 / 5 / 8 / 11 月", watch: "InP 收入占比首次披露；毛利率环比 +100bps；supply-limited 措辞；产能 ramp 时间表" },
  { ticker: "MRVL", months: "3 / 6 / 9 / 12 月", watch: "CPO 设计赢单数量；Teralynx 出货 timeline" },
];

// 管理层措辞阶梯（读 transcript 时定位所处阶段）
export const wordingLadder = ["developing", "customer sampling", "production ramp", "supply-limited"];

export const watchRoutine = [
  { freq: "每周", items: ["COHR 跌破 $320 = 加仓第一档", "LITE 涨破 $900 = 加空第一档", "Google Alerts: CPO / silicon photonics / InP laser（MRVL/AVGO/NVDA 任何 CPO 声明）"] },
  { freq: "每月", items: ["分析师目标价变化（COHR 上调 >5% = 强信号）", "13F 大户持仓变化", "8-K：产能公告、大合同"] },
  { freq: "每季", items: ["四家财报按序：GLW → GFS → COHR → MRVL", "措辞阶梯定位 + guidance 中 CPO 首次出现的收入/timeline"] },
];

// ── 7. 风险场景 ────────────────────────────────────
export const riskScenarios = [
  {
    name: "E · 一切顺利（基准）",
    prob: 25,
    trigger: "COHR 首次 CPO 收入 2027Q4 兑现",
    impact: "COHR 2028 年翻倍至 $700+；LITE 回归 $400；组合 IRR 约 40-60%",
    hedge: "按作战计划执行即可",
    baseline: true,
  },
  {
    name: "A · CPO 商业化推迟",
    prob: 30,
    trigger: "MRVL Teralynx 推迟至 2028H2 之后",
    impact: "COHR 主升浪推迟 12 个月，可能回到 $200",
    hedge: "LITE 空头同步获利（都跌，LITE 跌更狠）",
  },
  {
    name: "C · 云厂商自研 CPO",
    prob: 20,
    trigger: "MSFT/Google/Amazon 宣布自研光引擎",
    impact: "LITE 反弹（云厂商仍需 InP 芯片）+ COHR 短期回调",
    hedge: "切断 LITE 空头 + 观察 GFS 是否被选为代工",
  },
  {
    name: "B · 中国 InP 突破",
    prob: 15,
    trigger: "华为/中兴 InP 良率突破 6 英寸",
    impact: "COHR 定价权受损",
    hedge: "仓位上限严守 20%，不加杠杆",
  },
  {
    name: "D · AI Capex 见顶",
    prob: 10,
    trigger: "MSFT/Google/AMZN Capex YoY 首次转负",
    impact: "整条链回调 30-50%",
    hedge: "死亡谷加深 = 加满仓位的最好时机（反直觉）",
  },
];

// 行情表需要拉的全部代码
export const QUOTE_SYMBOLS = scoredTickers.map((t) => t.ticker);
