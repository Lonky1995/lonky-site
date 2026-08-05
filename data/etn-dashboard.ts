// ETN 催化剂追踪看板 — 静态研究数据
// 内容来源：ETN 催化剂追踪研究笔记（Q2 2026 财报 / Mobility+Dana 交易 / NVIDIA GTC 2026 / Bernstein SDC）
// 更新方式：改这个文件 → push main → Vercel 自动部署

export const LAST_UPDATED = "2026-08-06";

export const QUOTE_SYMBOLS = ["ETN", "DAN", "NVDA", "ABB", "SU.PA"] as const;

// ── 00 一句话钩子 ──────────────────────────────────
export const hook =
  "Q1 利润率骤降 640bp 时，空头喊「结构性恶化」。Q2 回升到 27.5%、单日 +7.3%，把这个论点打回去了一半。剩下一半，全押在 Q3——H2 指引承诺同比 +450-500bp，这是多空叙事的终极对赌。";

export const snapshot = {
  ticker: "ETN",
  name: "Eaton Corporation",
  sector: "Industrials / Electrical Equipment",
  price: "~$449",
  marketCap: "~$1,750亿",
  position: "无仓位 · 待 Q3 验证",
  bull: { target: "$534", by: "Bernstein" },
  bear: { target: "$360", by: "UBS" },
};

// ── 01 催化剂时间线 ─────────────────────────────────
export type TimelineNode = {
  period: string;
  status: "done" | "pending" | "future";
  events: string[];
};

export const timeline: TimelineNode[] = [
  {
    period: "2026 Q1",
    status: "done",
    events: ["Boyd 收购完成", "NVIDIA Vera Rubin DSX 发布"],
  },
  {
    period: "2026 Q2",
    status: "done",
    events: ["Bernstein SDC Best Idea", "Mobility + Dana 合并宣布", "Q2 业绩超预期（+7.3%）"],
  },
  {
    period: "2026 H2",
    status: "pending",
    events: ["SST 首批订单？", "Q3 业绩 — 利润率验证关键", "800V DC 渗透"],
  },
  {
    period: "2027 Q1",
    status: "future",
    events: ["Mobility + Dana 交易完成", "2027 年备考指引"],
  },
];

// ── 02 已发生催化剂 ─────────────────────────────────

export const q2Beat = {
  date: "2026-07-31",
  reaction: "+7.3%",
  headline: "Q2 2026 业绩全面超预期",
  metrics: [
    { label: "净销售额", actual: "$85.3亿", consensus: "~$81亿", delta: "+5% beat" },
    { label: "调整后 EPS", actual: "$3.18", consensus: "~$3.09", delta: "+3% beat" },
    { label: "分部利润", actual: "$19.7亿", consensus: "~$18.4亿", delta: "+7% beat" },
    { label: "营业利润率", actual: "23.1%", consensus: "—", delta: "环比 +190bp" },
    { label: "电气美洲利润率", actual: "27.5%", consensus: "—", delta: "超指引上限" },
  ],
  guidance: [
    { label: "有机营收增长", from: "9-11%", to: "11-13%", delta: "+200bp" },
    { label: "调整后 EPS", from: "$13.05-$13.50", to: "$13.40-$13.60", delta: "中值 +$0.23" },
    { label: "H2 利润率", from: "—", to: "同比 +450-500bp", delta: "隐含增量利润率 ~40%" },
  ],
  segments: [
    { line: "电气美洲", growth: "+18%", note: "订单 +41%，book-to-bill 1.3x" },
    { line: "电气全球", growth: "+18%", note: "数据中心有机 +65%（vs 市场 +23%），DC 积压 +54%" },
    { line: "Boyd（液冷）", growth: "Q2 $4.32亿", note: "超公司预估 20%，全年指引上调至 $18亿" },
  ],
  takeaway:
    "这不是普通 beat。Q1 利润率骤降至 25.6%（同比 -640bp）曾让市场恐慌，空头喊「结构性恶化」。Q2 回升至 27.5%、且是运营驱动（非一次性因素），直接证伪了空头最有力的论点。提价 + 降本 + 产能释放三重驱动同时生效。",
};

export const danaDeal = {
  announced: "2026 年 6 月",
  closing: "2027 年 Q1",
  terms: [
    { label: "合并后企业价值", value: ">$100亿" },
    { label: "Mobility 估值", value: "$51亿" },
    { label: "估值倍数", value: "8.3x 2026E EBITDA / 含协同 5.9x" },
    { label: "Eaton 获现金分配", value: "~$11亿" },
    { label: "Eaton 股东持股", value: "≥50.1%" },
    { label: "年化协同效应", value: "$2.5亿" },
    { label: "合并后收入 / EBITDA", value: "~$110亿 / ~$17亿" },
    { label: "税务结构", value: "Reverse Morris Trust（免税）" },
  ],
  layers: [
    {
      title: "组合纯净化",
      text: "从「电气 + 宇航 + 汽车」→「电气 + 宇航」，完全对标电气化 / AI / 数字化长趋势。公司自身指引：交易完成后立即提升有机增长率和营运利润率。",
    },
    {
      title: "去杠杆",
      text: "$11亿现金直接用于偿债，缓解 $120亿收购后的资产负债表压力（当前净债务 / EBITDA 3.44x）。",
    },
    {
      title: "比原方案好得多",
      text: "原计划是简单分拆上市（无协同、无现金），现在升级为合并：有 $2.5亿协同、$11亿现金、且免税。",
    },
  ],
  underrated:
    "市场对此反应平淡，因为 Mobility 仅占营收 6.5%、利润 3-4%。但真正的价值在于：(1) 释放 $11亿现金改善资产负债表 (2) 消除「汽车周期股」标签，为估值重估铺路 (3) 合并后 Eaton 仍持 ≥50.1%，保留上行空间。",
};

export const nvidiaDeal = {
  date: "2026 年 3 月（GTC 2026）",
  points: [
    "Eaton「从电网到芯片」全栈方案集成至 NVIDIA Vera Rubin DSX AI 工厂参考设计",
    "面向 ~$7万亿 数据中心建设市场",
    "覆盖：电网基础设施 → 电力分配 → 芯片级液冷",
    "支持兆瓦级 → 数百兆瓦级灵活扩展",
    "Eaton SimReady 3D 资产进入 NVIDIA Omniverse DSX（数字孪生）",
    "联合 Siemens Energy 缓解电网瓶颈，释放高达 100GW 电网容量",
  ],
  takeaway:
    "这不是普通的合作公告。NVIDIA 把 Eaton 的系统写入了 AI 工厂的参考设计蓝图——这意味着 Eaton 成为 AI 基础设施行业标准的一部分。这是对空头「电力组件商品化」论点最直接的证伪。",
};

export const bernstein = {
  date: "2026-06-03",
  rating: "跑赢大盘",
  target: "$534",
  points: [
    "42 届 Strategic Decisions Conference 上作为 Best Idea 专题演示",
    "「三重威胁」框架：周期复苏 + 电力基建结构性赢家 + 被低估的组合转型",
    "2025-2030 EPS CAGR 18%（vs 市场共识 12%）",
    "2030E EPS $27 × 31x P/E = $849（翻倍）",
    "SOTP 公允价值 ~$535",
  ],
};

export const minorEvents = [
  { event: "FranklinWH 家庭能源合作", date: "7月9日", meaning: "「Home as a Grid」战略落地，住宅能源管理" },
  { event: "英国航空航天增材制造中心", date: "7月20日", meaning: "欧洲宇航产能扩张，本土化供应链" },
  { event: "季度股息 $1.10/股", date: "7月宣布", meaning: "8月28日除息，持续分红记录" },
  { event: "Boyd Q2 超预期 20%", date: "7月31日", meaning: "液冷第二曲线最强验证信号" },
];

// ── 03 即将到来的催化剂 ─────────────────────────────

export const q3Watch = {
  when: "2026 年 10 月底",
  why: "H2 指引利润率同比 +450-500bp。这是多头「利润率暂时性爬坡」叙事 vs 空头「结构性恶化」叙事的终极验证。",
  bull: ["利润率 ≥28.5%，同比转正", "DC 订单增速稳定在 +60% 以上", "Boyd 保持超预期"],
  bear: ["利润率 <27%，恢复显著慢于指引", "DC 订单增速降至 +50% 以下"],
  pricing: "当前股价已部分定价 Q3 改善预期，需要 beat 而非仅仅 meet。",
};

export const upcoming = [
  {
    name: "SST 固态变压器首批订单",
    when: "2026 H2",
    priority: "mid" as const,
    impact: "开启新成长叙事，技术护城河深化",
    expectation: "低预期，若有则惊喜",
  },
  {
    name: "800V DC 产品大客户突破",
    when: "2026 H2",
    priority: "mid" as const,
    impact: "验证全栈 DC 战略，绑定 AI 芯片路线图",
    expectation: "渐进式",
  },
  {
    name: "Mobility + Dana SEC 文件提交",
    when: "2026 H2",
    priority: "mid" as const,
    impact: "交易细节明朗化，监管审批进展",
    expectation: "程序性",
  },
  {
    name: "液冷技术路线验证",
    when: "2026 H2 - 2027",
    priority: "mid" as const,
    impact: "CoolIT 15kW 冷板测试若成功 → 推迟两相 DTC 需求 → Boyd 单相冷板寿命延长",
    expectation: "技术不确定性",
  },
  {
    name: "Mobility + Dana 交易完成",
    when: "2027 Q1",
    priority: "low" as const,
    impact: "$11亿现金到账 → 去杠杆 → 重启回购；组合纯净化 → 估值重估",
    expectation: "方向性事件",
  },
  {
    name: "2027 年备考指引",
    when: "2027 Q1",
    priority: "low" as const,
    impact: "首次给出不含 Mobility 的全年指引，备考增速和利润率将为「新 Eaton」提供基准定价锚",
    expectation: "方向性事件",
  },
];

// ── 04 定价状态评估 ─────────────────────────────────
// priced: 2 = 已定价, 1 = 部分定价, 0 = 未定价
export const pricingStatus = [
  { catalyst: "Q2 业绩超预期", priced: 2, basis: "股价 +7.3%" },
  { catalyst: "全年指引上调", priced: 2, basis: "反映在 post-earnings 涨幅中" },
  { catalyst: "H2 利润率恢复", priced: 1, basis: "当前 ~31x 2027E P/E 隐含了恢复预期，但未完全定价" },
  { catalyst: "Mobility + Dana 合并", priced: 1, basis: "市场关注度低，$11亿现金 + 纯净化溢价尚未反映" },
  { catalyst: "NVIDIA 生态绑定", priced: 1, basis: "中长期叙事，短期难以量化" },
  { catalyst: "Boyd 液冷超预期", priced: 1, basis: "全年仅上调 $17→$18亿，仍有上修空间" },
  { catalyst: "SST / 800V DC 新订单", priced: 0, basis: "完全未反映，纯上行期权" },
  { catalyst: "2027 备考指引", priced: 0, basis: "要到 2027 Q1" },
];

export const PRICED_LABELS = ["未定价", "部分定价", "已定价"];

// ── 05 监控清单 ─────────────────────────────────────
export const q3Checklist = [
  "电气美洲利润率 ≥28.5%（同比转正）",
  "整体营业利润率同比改善",
  "DC 订单增速维持在 +60% 以上",
  "Boyd 营收按年化 $18亿+ 运行",
  "订单出货比维持在 1.2x+",
  "铜 / 铝价格走势及定价传导状态",
  "管理层对 H2 利润率指引口径变化",
];

export const longChecklist = [
  "Mobility + Dana 监管审批进展",
  "SST 客户进展公告",
  "800V DC 合作伙伴 / 订单",
  "科技巨头 CapEx 指引变化",
  "竞争格局：ABB / Siemens / Schneider 扩产进度",
  "电网互联排队时间变化",
];

// ── 06 逻辑链 ───────────────────────────────────────
export const logicChain = {
  done: {
    title: "已完成 · 验证信心",
    items: [
      { head: "Q2 超预期（+7.3%）", subs: ["利润率环比 +190bp", "Boyd 超预期 20%", "DC 有机 +65%", "全年指引上调"] },
      { head: "Mobility + Dana 合并", subs: ["$51亿估值 + $11亿现金", "组合纯净化", "2027 Q1 完成"] },
      { head: "NVIDIA Vera Rubin DSX", subs: ["AI 工厂参考设计核心组件", "$7万亿 TAM", "生态锁定效应"] },
    ],
  },
  next: {
    title: "即将到来 · 验证估值",
    items: [
      { head: "Q3 业绩 ← 最关键验证点", subs: ["利润率能否同比转正？", "H2 +450-500bp 能否兑现？", "若通过 → $500-$534 区间", "若失败 → 空头叙事成立"] },
      { head: "SST 首批订单 ← 惊喜催化剂", subs: ["低预期，上行动力强"] },
      { head: "2027 Q1 交易完成 + 2027 指引", subs: ["估值重估窗口"] },
    ],
  },
};

// ── 07 本周关注 ─────────────────────────────────────
export const thisWeek = [
  { when: "8月4日", what: "股价收于 $444.77（+1.49%），延续 post-earnings 强势" },
  { when: "8月5日", what: "盘中 $449.48（+1.06%），成交量放大" },
  { when: "近期", what: "关注是否有 post-Q2 分析师目标价上调潮" },
  { when: "宏观", what: "关注美联储利率预期和科技股情绪（AI CapEx 叙事联动）" },
];
