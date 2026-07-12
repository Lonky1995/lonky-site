// CPO / 光互联叙事看板 — 静态研究数据
// 内容来源：Obsidian vault CPO 研究笔记 + 用户补充研报（MS / Bernstein / Nomura / Marvell）
// 更新方式：改这个文件 → push main → Vercel 自动部署

export const LAST_UPDATED = "2026-07-12";

// ══════════════════════════════════════════════════
// 叙事故事线：大行业 → 瓶颈墙 → CPO 登场 → 路线之争
//            → 产业链卡位 → 角色卡片 → 供需 → 观测点
// ══════════════════════════════════════════════════

// ── 00 一句话钩子 ──────────────────────────────────
export const hook =
  "AI 算力爆发把数据中心网络逼到功耗墙、密度墙、铜缆墙三堵墙前。CPO（共封装光学）是打穿这三堵墙的下一代互连方案——而 InP 激光器，是它最卡脖子的一环。";

// ── 01 大行业背景：AI 数据中心 ─────────────────────
export const industry = {
  name: "AI 数据中心",
  role: "CPO 的母体行业",
  whatsHappening:
    "GPU 集群规模指数级扩大（NVL72 机架 → 更大 domain），交换机端口速率从 400G/800G 向 1.6T/3.2T/6.4T 升级。互连——不是算力——正在成为决定集群规模上限的瓶颈。",
  macroStats: [
    { value: "$8,300亿", label: "2026 全球 CSP 资本开支（+79% YoY）", source: "TrendForce" },
    { value: "132GW", label: "2026 全球数据中心用电（2030E 290GW）", source: "ETN Q1 财报引述" },
    { value: "6.4T", label: "交换机端口速率演进目标（TSMC COUPE 2026 规划）", source: "TSMC 路线图" },
  ],
};

// ── 02 三堵墙：为什么网络成了瓶颈 ───────────────────
export type Wall = {
  name: string;
  headline: string;
  detail: string;
  data: { label: string; value: string }[];
  source: string;
};

export const walls: Wall[] = [
  {
    name: "功耗墙",
    headline: "光模块正在吞掉交换机的电",
    detail:
      "传统可插拔光模块靠 DSP 芯片还原信号，高速率下功耗极高。端口密度翻倍后，若沿用可插拔，系统功耗会被光模块吃光。",
    data: [
      { label: "传统 DSP 可插拔 @1.6T", value: "20-22 pJ/bit" },
      { label: "CPO", value: "~5 pJ/bit（降 3/4+）" },
      { label: "CPO ASP vs 可插拔", value: "8-10x（造价代价）" },
    ],
    source: "Morgan Stanley《Optical Market Opportunities》2026-02-23",
  },
  {
    name: "密度墙",
    headline: "前面板插满了，DSP 也扛不住散热",
    detail:
      "可插拔光模块依赖交换机前面板，体积和面板空间在 1.6T 时代已达物理极限；DSP 在高速率下面临严重散热与信号衰减（interface losses）。",
    data: [
      { label: "前面板密度", value: "1.6T 已达物理极限" },
      { label: "DSP 高速率", value: "散热 + 信号衰减双重压力" },
      { label: "CPO 良率", value: "热管理/封装复杂 → 良率仍低" },
    ],
    source: "Bernstein《War for AI DC Connectivity》2026-05-08 + MS 2026-02-23",
  },
  {
    name: "铜缆墙",
    headline: "铜缆随速率翻倍在快速缩短",
    detail:
      "无源铜缆（DAC，0W）便宜但极短，有源铜缆（AEC）延长有限。速率每翻倍，铜缆有效距离急剧缩短，迟早短于一个机柜的高度。Marvell「铜墙」：100G(2021)5m → 200G(2025)2.5m → 400G(2028)1.25m → 1.6T 仅剩 0.3m。",
    data: [
      { label: "224G · DAC / AEC", value: "≈2m / 7m" },
      { label: "800G · DAC / AEC / AOC", value: "2-3m / 5m / 100m" },
      { label: "铜墙递减 100→1.6T", value: "5m → 0.3m" },
    ],
    source: "Bernstein 2026-05-08 · Nomura 2026-01-09 Fig.43 · Marvell（MS 台湾行 2026-06-08）",
  },
];

// ── 03 CPO 登场：是什么 + 不可或缺性 ───────────────
export const cpoIntro = {
  definition:
    "CPO（Co-Packaged Optics，共封装光学）= 把光引擎和交换机 ASIC 封装进同一个 Package，消除电信号在 PCB 上的长距离走线。",
  solves: "光引擎贴着 ASIC → 电-光转换距离趋近零 → 功耗大降、带宽密度大升，直接绕过三堵墙。",
  // 不可或缺性论点 + 硬支撑
  indispensable: [
    {
      point: "LPO 只是续命，不是终局",
      backing:
        "LPO（线性直驱）能把功耗降到 16-18 pJ/bit，但仍受可插拔形态的物理密度限制，且依赖交换机 ASIC 端高级 DSP 补偿。速率向 3.2T+ 演进时，封装距离必须缩短——LPO 撑不到那一步。",
    },
    {
      point: "大厂已把 CPO 写进先进封装路线图",
      backing:
        "TSMC 把 COUPE（CPO 技术）纳入 CoWoS 路线图：2026 实现 6.4T OE 集成，2027 整合进 CoWoS 基板。NVIDIA（Quantum-X/Spectrum-X）与 Broadcom（Bailly/Davisson）已完成 CPO 交换机展示或小批量出货——CPO 已跨过概念阶段。",
    },
    {
      point: "硅光反而放大了 InP 的不可或缺",
      backing:
        "CPO 硅光子芯片自己不发光，需要外部激光源（ELS）。这把光源需求集中到少数极高功率 InP 激光器（CW/UHP）上——InP 不是可选替代，而是 CPO 的核心咽喉。",
    },
  ],
};

// ── 04 技术路线之争（叙事核心）─────────────────────
export type Route = {
  name: string;
  principle: string;
  maturity: string;
  power?: string;
  reps: string[];
  bottleneck: string;
  isHero?: boolean;
};

export const routes: Route[] = [
  {
    name: "DSP 可插拔（传统）",
    principle: "模块内含 DSP 芯片还原信号，插在交换机前面板",
    maturity: "绝对主流，向 1.6T/3.2T 演进",
    power: "20-22 pJ/bit",
    reps: ["中际旭创", "新易盛", "COHR", "LITE"],
    bottleneck: "功耗极高、前面板密度撞墙、端口带宽受连接器数量限制",
  },
  {
    name: "LPO / LRO（线性直驱）",
    principle: "去掉模块内 DSP，用线性 Driver/TIA，靠交换机 ASIC 端补偿",
    maturity: "过渡方案，正在量产，近期受 CSP 青睐",
    power: "16-18 pJ/bit",
    reps: ["旭创", "新易盛", "Macom"],
    bottleneck: "功耗仍高于 CPO、传输距离受限、互操作性依赖特定交换机芯片",
  },
  {
    name: "NPO（近封装）",
    principle: "光引擎不插面板，放在交换机 PCB 上，但仍可拆卸",
    maturity: "准量产（2026 底-2027）",
    reps: ["NVIDIA（务实派）", "Lotes（Socket）"],
    bottleneck: "折中方案，未彻底消除 PCB 上高频信号走线损耗",
  },
  {
    name: "CPO（共封装）",
    principle: "光引擎直接集成到交换芯片同一基板/硅中介层上",
    maturity: "早期商业化（2026-27 Scale-out），2028+ 放量",
    power: "~5 pJ/bit",
    reps: ["Broadcom（激进真 CPO）", "TSMC COUPE", "NVIDIA Spectrum 6800"],
    bottleneck: "良率低、测试复杂、不可热插拔（故障换整机柜）、初期 ASP 高 8-10x",
    isHero: true,
  },
];

// 路线之争的张力点：两大链主的分歧
export const routeTension = {
  title: "两大链主的路线分歧",
  broadcom: {
    name: "Broadcom · 激进「真 CPO」派",
    stance: "光引擎（OE）直接长在基板上，赌彻底的功耗/密度优势",
    products: "Bailly / Davisson",
  },
  nvidia: {
    name: "NVIDIA · 务实「NPO」派",
    stance: "OE 可拆卸换修，牺牲部分性能换可靠性/可维护性——它的「CPO」严格说是 NPO",
    products: "Quantum-X / Spectrum-X / Spectrum 6800",
  },
  takeaway:
    "分歧的本质是「性能极致」vs「CSP 可靠性顾虑」。谁的路线成为标准，决定整条产业链的适配方向。",
};

// 谁会赢 / 共存
export const coexistence = {
  timeline:
    "2026-2027：LPO/NPO 作为过渡主力吃掉 1.6T 时代大部分份额；CPO 2026 底-2027 从 Scale-out（集群间）切入，2028+ 随 3.2T 交换机普及迎主升浪。",
  reason:
    "CSP 对 CPO 可靠性与供应商集中度有顾虑（不可热插拔 = 停机风险），LPO/NPO 与 CPO 未来 3-5 年长期共存。",
  penetration: "CPO 渗透率 2030 预计 20%，SAM 约 $70 亿（UBS 测算）",
};

// ── 05 产业链卡位（BOM 分层）───────────────────────
export type BomLayer = {
  layer: string;
  segment: string;
  tickers: string[];
  replaceability: "极低" | "低" | "中";
  priceIn: 0 | 1 | 2 | 3;
  note: string;
  key?: boolean;
};

export const PRICE_IN_LABELS = ["几乎未定价", "部分定价", "充分定价", "过度定价"] as const;

export const bomLayers: BomLayer[] = [
  {
    layer: "L1",
    segment: "Switch ASIC 设计/制造",
    tickers: ["MRVL", "AVGO", "TSM"],
    replaceability: "低",
    priceIn: 2,
    note: "MRVL Teralynx 是需求端最强确认信号，但 CPO 收入 2028H2 才来；TSMC CoWoS/COUPE 是唯一制造底座",
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
    segment: "InP 激光器 / ELS（CW/UHP）",
    tickers: ["COHR", "LITE"],
    replaceability: "极低",
    priceIn: 1,
    note: "最关键卡脖子项：每台 51.2T CPO 交换机约需 256 颗，物理上无法用硅替代。硅光需外部光源 → InP 需求被 CPO 放大",
    key: true,
  },
  {
    layer: "L3",
    segment: "Glass Bridge 光学连接",
    tickers: ["GLW"],
    replaceability: "极低",
    priceIn: 1,
    note: "GLW 独占（离子交换玻璃晶圆，耦合损耗 <2dB）；但市值 $190B，CPO 弹性被大盘体量稀释",
    key: true,
  },
  {
    layer: "L0",
    segment: "InP 衬底（上游材料）",
    tickers: ["AXTI"],
    replaceability: "低",
    priceIn: 3,
    note: "小玩家、无定价权、收入 -11% YoY，却被情绪推到 34x P/S——长期空头候选",
  },
  {
    layer: "L4-5",
    segment: "封装基板 / 先进封装 / 测试",
    tickers: ["BESI", "FN", "6857.T", "2360.TW"],
    replaceability: "中",
    priceIn: 1,
    note: "CPO 封装难度指数级上升，良率与测试成为卖点；测试步骤从 1-2 步暴增到 5 步（晶圆级→系统级）",
  },
];

// ── 06 叙事化角色卡片 ──────────────────────────────
export type RoleCard = {
  ticker: string;
  name: string;
  role: string; // 一句话身份
  story: string;
  hasQuote: boolean; // 是否拉实时价（美股 true，台股/日股 false）
  tone: "hero" | "throat" | "arms" | "assembly" | "water";
};

export const roleCards: RoleCard[] = [
  {
    ticker: "AVGO",
    name: "Broadcom",
    role: "链主 · 激进真 CPO 派",
    story: "OE 直接长在基板上，赌彻底功耗/密度优势。不只造芯片，更在定义 CPO 测试标准和生态（Bailly/Davisson）。",
    hasQuote: true,
    tone: "hero",
  },
  {
    ticker: "NVDA",
    name: "NVIDIA",
    role: "链主 · 务实 NPO 派",
    story: "OE 可拆卸换修，牺牲部分性能换可靠性。它的「CPO」严格说是 NPO——务实路线更契合 CSP 停机顾虑。",
    hasQuote: true,
    tone: "hero",
  },
  {
    ticker: "TSM",
    name: "台积电",
    role: "军火商 · 制造底座",
    story: "COUPE 平台把 CPO 变成 CoWoS 的一个子模块。不直接赚光器件的钱，但锁死先进封装产能护城河。",
    hasQuote: true,
    tone: "arms",
  },
  {
    ticker: "COHR",
    name: "Coherent",
    role: "咽喉 · InP 双雄之一（估值便宜）",
    story: "垂直整合最深（外延→激光器→调制器→硅光→模组全栈），Q1 已 supply-limited，10x P/S 估值中性偏合理——主仓首选。",
    hasQuote: true,
    tone: "throat",
  },
  {
    ticker: "LITE",
    name: "Lumentum",
    role: "咽喉 · InP 双雄之一（估值贵）",
    story: "UHP 超高功率激光器与 NVIDIA 深度绑定，是 CPO 时代最大单品价值增量卡位；但 39x P/S 已把这层绑定充分定价——技术卡位强、估值偏贵。",
    hasQuote: true,
    tone: "throat",
  },
  {
    ticker: "GFS",
    name: "GlobalFoundries",
    role: "沉默的期权 · 硅光平台",
    story: "唯一公开绑定 Glass Bridge 的硅光代工，V 型槽为 30μm 间距专门适配。市场当普通代工厂定价，CPO 溢价完全没进去。",
    hasQuote: true,
    tone: "throat",
  },
  {
    ticker: "FN",
    name: "Fabrinet",
    role: "组装枢纽 · 光器件富士康",
    story: "CPO 让封装难度指数级上升，良率保障成为卖点。TFC（3081.TW）是其核心组件供应商。",
    hasQuote: false,
    tone: "assembly",
  },
  {
    ticker: "2360.TW",
    name: "Chroma ATE",
    role: "卖水人 · 测试设备（台股）",
    story: "CPO 测试从 1-2 步暴增到 5 步（晶圆级→系统级）。Chroma 在 CPO 从 0 到 1 阶段率先卖铲子。",
    hasQuote: false,
    tone: "water",
  },
  {
    ticker: "6857.T",
    name: "Advantest",
    role: "卖水人 · 硅光晶圆级 ATE（日股）",
    story: "已拿下首批量产 ATE 订单，CEO 预期 CPO 测试仪销量今明两年翻倍——「CPO 悄悄爆发」的隐秘赢家。",
    hasQuote: false,
    tone: "water",
  },
];

// ── 07 供需缺口测算（InP 激光器）───────────────────
export const supplyDemand = {
  subject: "InP 激光器（核心 BOM，单颗价值最高）",
  demandSide: [
    { label: "每台 51.2T CPO 交换机", value: "≈256 颗" },
    { label: "2027E 全球 CPO 交换机出货", value: "5-10 万台" },
    { label: "CPO 年增量需求", value: "≈1,900 万颗" },
    { label: "传统光通信年需求", value: "4,000-5,000 万颗" },
    { label: "CPO 增量占现有市场", value: "40-50%" },
  ],
  supplySide: [
    { label: "COHR + LITE 双寡头产能上限（估算）", value: "6,000-7,000 万颗/年" },
    { label: "COHR 扩产计划", value: "一年内翻倍 + 6 英寸切换成本降 50%" },
    { label: "扩产周期", value: "18-24 个月，2027 前无法完全释放" },
  ],
  scenarios: [
    { name: "乐观情景", assumption: "2027 CPO 出货 7.5 万台", math: "需求 6,900 万 vs 供给 6,500-7,500 万", result: "紧平衡到轻度短缺", good: true },
    { name: "悲观情景", assumption: "2027 CPO 只出 3 万台", math: "需求 5,750 万 vs 供给 7,000 万", result: "约 20% 过剩", good: false },
  ],
  conclusion:
    "尾部风险偏乐观：只要 CPO 交换机出货 > 5 万台/年，COHR 就是绝对赢家。这个门槛不难达到——MRVL/AVGO/NVDA 都在推。",
};

// ── 08 观测点 & 验证节点 ───────────────────────────
export const adoptionCurve = [
  { stage: "① 技术发布期", window: "0-6 个月", desc: "概念炒作，无收入，波动剧烈", current: true },
  { stage: "死亡谷", window: "2026Q4-2027Q1（预计）", desc: "商业化慢于预期，回调 -30%~-50% — 最佳建仓窗口", danger: true },
  { stage: "② 客户验证期", window: "6-18 个月", desc: "小批量试用、设计赢单公告，横盘为主" },
  { stage: "③ 收入兑现期", window: "18-36 个月", desc: "财报出现具体收入数字 → 主升浪、估值重构" },
  { stage: "④ 渗透率定价期", window: "3-5 年", desc: "渗透率 5%→30%+，警惕估值泡沫" },
];

export const alphaChain = [
  { observe: "TSMC 加订 ASML/KLA", infer: "GLW/GFS 硅光订单跟进", lag: "1-2 季度" },
  { observe: "GLW 光纤扩产公告", infer: "Glass Bridge 量产临近", lag: "2-3 季度" },
  { observe: "MRVL Teralynx 出货", infer: "COHR/LITE InP 收入爆发", lag: "1-2 季度" },
  { observe: "Advantest CPO 测试仪订单放量", infer: "硅光晶圆级量产临近（隐秘先行指标）", lag: "1-2 季度" },
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
  { ticker: "COHR", months: "2 / 5 / 8 / 11 月", watch: "InP 收入占比首次披露；毛利率环比 +100bps；supply-limited 措辞" },
  { ticker: "MRVL", months: "3 / 6 / 9 / 12 月", watch: "CPO 设计赢单数量；Teralynx 出货 timeline" },
];

export const wordingLadder = ["developing", "customer sampling", "production ramp", "supply-limited"];

// 行情表需要拉的美股代码（台股/日股纯叙事不拉价）
export const QUOTE_SYMBOLS = roleCards.filter((c) => c.hasQuote).map((c) => c.ticker);
