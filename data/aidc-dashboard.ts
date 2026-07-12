// AI 数据中心产业链看板 — 静态研究数据
// 内容来源：Obsidian vault 产业链研究笔记（林姐方法论 2026-07-01、AI电力基建框架 2026-06-26、
// CPO 框架 2026-06-27/28、中国基建类比 2026-06-26、AI服务器BOM 2026-06-24）
// 更新方式：改这个文件 → push main → Vercel 自动部署

export const LAST_UPDATED = "2026-07-12";

// ── 四铁律评分：0-2 分 ──────────────────────────────
// bottleneck 瓶颈 / monopoly 垄断 / elasticity 库存弹性 / ptsd 扩产PTSD
export type IronLaws = {
  bottleneck: 0 | 1 | 2;
  monopoly: 0 | 1 | 2;
  elasticity: 0 | 1 | 2;
  ptsd: 0 | 1 | 2;
};

// ── 1. 叙事总览 ────────────────────────────────────
export const narrative = {
  stageLabel: "需求爆发期尾段 → 产能过剩期初段过渡",
  stageAnalogy: "对标中国基建 2006-2008（类比来源：中金研究院）",
  // 四阶段刻度，position 0-100 表示当前位置
  stages: ["需求爆发", "产能扩张", "过剩承压", "出清"],
  stagePosition: 32,
  thesis:
    "AI 像中国基建：需求真实，利润往上游集中，下游还没赚到钱。但关键差异——芯片是规模经济而非规模不经济，上游超额利润窗口比中国基建短得多。",
  thesisSource: "中金研究院《关于AI投资泡沫争议的几点思考》",
  timeline: [
    { date: "2026-02", event: "RKLB 发布轨道数据中心太阳能阵列" },
    { date: "2026-04", event: "GEV Q1：backlog $116B→$163B（+40%），新签燃气轮机 21GW，定价 +10-20%" },
    { date: "2026-05", event: "ETN Q1：数据中心订单 +240% YoY，book-to-bill 1.2，同建 12 座新厂" },
    { date: "2026-06", event: "SpaceX IPO（SPCX）首日收 $160.95，市值 $2.1T，轨道算力叙事成型" },
    { date: "2026-06", event: "GEV 上调全年指引：营收 $45B，FCF $7B" },
  ],
  macroStats: [
    { value: "$8,300亿", label: "2026 全球 CSP 资本开支（+79% YoY）", source: "TrendForce" },
    { value: "132GW", label: "2026 全球数据中心用电（2030 达 290GW）", source: "ETN Q1 财报引述" },
    { value: "2,600GW", label: "排队等待接入美国电网的项目——卡点是电不是 GPU", source: "ETN Q1 财报" },
    { value: "16.4%", label: "2026 全球光纤供需缺口率（1.8 亿芯公里，历史首次）", source: "拓端算力报告" },
  ],
  // 投资时间链条：按市场已反映程度排序
  priceInChain: [
    { name: "GPU", status: "已部分反映" },
    { name: "存储 HBM", status: "正在反映" },
    { name: "CPO / 光互联 / MOCVD", status: "稍后" },
    { name: "液冷 / 电力", status: "更晚" },
  ],
};

// ── 2. 资金流 ──────────────────────────────────────
export const moneyFlow = {
  source: { label: "CSP 资本开支", value: "$8,300亿", note: "2026E，+79% YoY（TrendForce）" },
  branches: [
    {
      label: "AI 服务器 BOM",
      note: "GPU > HBM > MLCC（第三大成本项，价值量 +182%）",
      children: [
        { label: "GPU / 加速卡", note: "价值量最大，已部分反映" },
        { label: "HBM / 存储", note: "三寡头，LTA 锁定至 2030" },
        { label: "光互联（本看板主线①）", note: "GPU→光模块→EML→MOCVD→InP 衬底" },
        { label: "MLCC / 被动件", note: "44-60 万颗/机柜，日企三寡头" },
      ],
    },
    {
      label: "电力基础设施（本看板主线②）",
      note: "美国在建数据中心 32GW，70% 用于 AI，12 年 backlog",
      children: [
        { label: "发电设备", note: "GEV：燃气轮机 backlog +40%" },
        { label: "配电 / UPS", note: "ETN：订单 +240%，grid-to-chip" },
        { label: "散热 / 液冷", note: "VRT / Boyd（已被 ETN 收购）" },
      ],
    },
  ],
};

// ── 3. 产业链地图 ──────────────────────────────────
export type ChainNode = {
  segment: string;
  tickers: string[];
  laws: IronLaws;
  basis: string; // 一句话评分依据
};

export const chains: { name: string; flow: string; nodes: ChainNode[] }[] = [
  {
    name: "光互联 / CPO",
    flow: "GPU → 光模块 → EML → 外延 → 衬底",
    nodes: [
      {
        segment: "GPU / 加速卡",
        tickers: ["NVDA"],
        laws: { bottleneck: 2, monopoly: 2, elasticity: 1, ptsd: 0 },
        basis: "垄断最强但已部分反映；规模经济属性意味着超额利润窗口有限，管理层 aggressive 扩产",
      },
      {
        segment: "光模块",
        tickers: ["COHR", "LITE", "AAOI"],
        laws: { bottleneck: 1, monopoly: 0, elasticity: 1, ptsd: 1 },
        basis: "玩家多、定价权弱；AAOI 喊 50 万片但 capable ≠ deliver",
      },
      {
        segment: "EML / InP 激光器",
        tickers: ["COHR", "LITE"],
        laws: { bottleneck: 2, monopoly: 1, elasticity: 1, ptsd: 1 },
        basis: "良率是关键变量；LITE 北卡工厂全面转 6 英寸 = 良率问题解决的语气信号",
      },
      {
        segment: "外延设备 MOCVD",
        tickers: ["VECO", "AIXA.DE"],
        laws: { bottleneck: 1, monopoly: 2, elasticity: 1, ptsd: 1 },
        basis: "Veeco/Aixtron 寡头；设备订单是扩产意图的最早先行指标",
      },
      {
        segment: "InP 衬底",
        tickers: ["AXTI"],
        laws: { bottleneck: 2, monopoly: 2, elasticity: 2, ptsd: 2 },
        basis: "全球两寡头（住友/XTI），补产周期 18-36 个月，中日关系紧张带来时代红利",
      },
    ],
  },
  {
    name: "电力基础设施",
    flow: "发电 → 配电/UPS → 散热（grid-to-chip）",
    nodes: [
      {
        segment: "发电设备",
        tickers: ["GEV"],
        laws: { bottleneck: 2, monopoly: 1, elasticity: 2, ptsd: 2 },
        basis: "backlog +40%、新订单定价 +10-20%、管理层 disciplined；基本面最硬但估值已充分",
      },
      {
        segment: "配电 / UPS",
        tickers: ["ETN"],
        laws: { bottleneck: 2, monopoly: 1, elasticity: 1, ptsd: 1 },
        basis: "订单 +240%、backlog 历史新高；利润率下滑是建 12 座新厂的主动成本前置，市场误读",
      },
      {
        segment: "散热 / 液冷",
        tickers: ["VRT"],
        laws: { bottleneck: 1, monopoly: 1, elasticity: 1, ptsd: 1 },
        basis: "三项指引全部上调，最稳健但无惊喜；Boyd 被 ETN 收购后竞争格局微变",
      },
      {
        segment: "太空算力（期权）",
        tickers: ["RKLB"],
        laws: { bottleneck: 1, monopoly: 1, elasticity: 0, ptsd: 0 },
        basis: "全球最大 GaAs 太阳能产能扩至硅基；市场只当发射公司定价——但暂无大客户确认，纯期权",
      },
    ],
  },
];

// ── 4. 标的追踪 ────────────────────────────────────
export type WatchItem = {
  ticker: string;
  segment: string;
  chain: "光互联" | "电力" | "传导信号";
  thesis: string;
  catalyst: string;
  catalystDate?: string; // ISO，页面显示倒计时
  discipline: string; // 操作纪律：加减仓/止损条件
  position?: string; // 当前持仓状态
};

export const watchlist: WatchItem[] = [
  {
    ticker: "ETN",
    segment: "配电/UPS",
    chain: "电力",
    thesis: "被市场误读的错误定价：Q1 利润率下滑是建 12 座新厂的主动选择，H2 Electrical Americas 利润率承诺 >30%",
    catalyst: "Q3 财报利润率兑现 → 重新定价",
    catalystDate: "2026-11-01",
    discipline: "计划仓位 70%（$1.4 万），止损 -15%，持有至 Q3 财报",
  },
  {
    ticker: "GEV",
    segment: "发电设备",
    chain: "电力",
    thesis: "基本面最硬：backlog +40%，定价 +10-20%，但 PE 31x 已充分定价",
    catalyst: "回调至 $850 以下才有赔率；关注三菱/西门子能源抢单",
    discipline: "不追高，等回调 <$850 再评估",
  },
  {
    ticker: "VRT",
    segment: "散热/液冷",
    chain: "电力",
    thesis: "最稳健但无惊喜，三项指引全部上调，EMEA 暂时承压",
    catalyst: "液冷渗透率跳升 / EMEA 恢复",
    discipline: "观察仓，不适合进取型资金",
  },
  {
    ticker: "RKLB",
    segment: "太空电力",
    chain: "电力",
    thesis: "市场只当发射公司定价，未定价太空电力基础设施供应商身份；SpaceX IPO 是直接催化剂",
    catalyst: "太阳能阵列大客户公开确认",
    discipline: "小仓位博弈 30%（$0.6 万），期权仓思维，确认无客户则退出",
  },
  {
    ticker: "COHR",
    segment: "光模块/EML",
    chain: "光互联",
    thesis: "太空激光通信 + 数据中心光互联两条腿；CPO 链重回核心标的",
    catalyst: "OFC 等行业会议技术路线图 / 数据中心订单",
    discipline: "30 天 +20% 后性价比下降，等回调",
  },
  {
    ticker: "LITE",
    segment: "EML/激光器",
    chain: "光互联",
    thesis: "北卡工厂全面转 6 英寸 = 良率解决信号；但研究结论是已过度定价",
    catalyst: "6 英寸量产爬坡验证（pilot lot ≠ mass production）",
    discipline: "已过度定价，不追，等预期差",
  },
  {
    ticker: "AXTI",
    segment: "InP 衬底",
    chain: "光互联",
    thesis: "四铁律全高分环节：两寡头、18-36 月补产周期、地缘红利",
    catalyst: "InP 衬底 lead time 拉长 / 客户签 LTA",
    discipline: "跟踪衬底报价与 LTA 信号，逻辑确认再上仓位",
  },
  {
    ticker: "MRVL",
    segment: "硅光/DSP",
    chain: "光互联",
    thesis: "CPO 架构切换的受益方之一（Glass Bridge 路线相关）",
    catalyst: "CPO 商用化节奏",
    discipline: "研究仓，未建立完整 thesis",
  },
  {
    ticker: "MU",
    segment: "HBM/存储",
    chain: "传导信号",
    thesis: "存储链传导枢纽：MU 季报大涨 → 同步关注 Lam Research（etch/deposition）",
    catalyst: "每季财报（存储链景气度温度计）",
    discipline: "作为信号源观察，非本看板主线仓位",
  },
  {
    ticker: "WOLF",
    segment: "SiC（持仓）",
    chain: "传导信号",
    thesis: "破产重组后新股，8 英寸唯一量产工厂；反向 PTSD 案例——超前扩产致亏损",
    catalyst: "GE Aerospace 合作订单落地 / S-1 约 2,400 万股转售抛压消化",
    discipline: "持仓成本 $49，止损 $25；盯 Mohawk Valley 收入占比 + 毛利率方向",
    position: "持有中，浮亏约 27%",
  },
];

// ── 5. 信号看板 ────────────────────────────────────
export type Signal = {
  status: "pending" | "confirmed" | "failed";
  signal: string;
  method: string; // 验证方法
  action: string; // 兑现后动作
  due?: string; // 验证时点
};

export const signals: Signal[] = [
  {
    status: "pending",
    signal: "ETN Q3 财报：Electrical Americas 利润率 >30%",
    method: "读 Q3 Earnings Call Transcript（约 2026-11），对照管理层 H2 承诺",
    action: "兑现 → 确认 thesis，持有；未兑现 → 触发离场评估",
    due: "2026-11",
  },
  {
    status: "pending",
    signal: "MU 财报向存储链传导",
    method: "MU 季报 + Lam Research 订单反应（设备商先行芯片厂一个季度）",
    action: "传导确认 → 存储→CPO 时间链条推进，加大光互联关注",
    due: "每季",
  },
  {
    status: "pending",
    signal: "MOCVD 设备订单变化（Veeco/Aixtron）",
    method: "两家季报 + 客户资本开支指引；设备订单 = 扩产意图最早指标",
    action: "订单放量 → 光互联上游扩产确认，检查 AXTI 衬底逻辑",
  },
  {
    status: "pending",
    signal: "CEO 语气：remain disciplined → aggressive",
    method: "Earnings Call + Fireside Chat 亲自读原文，AI 翻译会丢细节",
    action: "转 aggressive = 扩产 PTSD 消退 → 红利期进入倒计时，收紧止盈",
  },
  {
    status: "pending",
    signal: "InP 衬底 lead time 拉长 / LTA 签约",
    method: "AXTI 财报 + 客户（COHR/LITE）供应链表述",
    action: "强信号确认（缺口 >40% + 扩产 >18 月）→ AXTI 上仓位",
  },
  {
    status: "pending",
    signal: "WOLF S-1 转售抛压消化",
    method: "跟踪成交量 + 股价对 $25 止损位的距离",
    action: "跌破 $25 → 无条件止损；GE Aerospace 订单落地 → 重估",
  },
  {
    status: "pending",
    signal: "光纤缺口 16.4% 是否形成投资机会",
    method: "长飞光纤/亨通光电报价与产能数据",
    action: "缺口持续 → 研究光纤标的（当前未建仓）",
  },
  {
    status: "pending",
    signal: "GEV 回调至 $850 以下",
    method: "价格监控 + 回调原因判别（估值消化 vs 逻辑破坏）",
    action: "估值消化型回调 → 建仓；抢单/定价权受损型 → 放弃",
  },
];

// 行情表需要拉的全部代码
export const QUOTE_SYMBOLS = watchlist.map((w) => w.ticker);
