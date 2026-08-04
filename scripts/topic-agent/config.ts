/**
 * 账号定位配置 —— 这是整个 agent 的"判断标准"。
 *
 * 选题 agent 之所以能工作，不是因为它会抓热点，而是因为它知道
 * **什么热点跟这个账号有关**。抖音热榜八成是娱乐八卦，没有这份配置
 * 就只能推一堆正确的废话。
 *
 * 定位变了就改这里，不要改 signals.ts。
 */

export interface Pillar {
  code: string;
  name: string;
  /** 命中这些词说明热点可能落在这个栏目里 */
  keywords: string[];
  /** 内容占比目标，用于提示 DeepSeek 平衡各栏目 */
  targetShare: number;
}

export const PERSONA = {
  oneLiner:
    "一个全职妈妈，公开记录自己用 AI 挣到第一笔钱、走回职场的全过程——包括所有踩过的坑和没赚到的钱。",
  audience: "被副业骗过、想搞钱或想重返职场的宝妈。默认带着防御心，最怕再被割一次。",
  voice: "第一人称、进行时、可验证、不承诺。是同行者，不是老师。",
} as const;

export const PILLARS: Pillar[] = [
  {
    code: "A",
    name: "避坑打假",
    // 刻意不放"曝光"这类泛词——它在娱乐八卦标题里天天出现，会把无关内容放进来
    keywords: ["骗", "割韭菜", "套路", "智商税", "避坑", "维权", "投诉", "退款", "虚假", "翻车"],
    targetShare: 0.2,
  },
  {
    code: "B",
    name: "真实账本",
    keywords: ["收入", "接单", "变现", "赚", "报价", "结算", "时薪", "成本", "订单", "甲方"],
    targetShare: 0.3,
  },
  {
    code: "C",
    name: "上手教程",
    keywords: ["简历", "面试", "作品集", "空窗", "求职", "转行", "技能", "教程", "入门", "工具"],
    targetShare: 0.25,
  },
  {
    code: "D",
    name: "情绪共鸣",
    keywords: ["全职妈妈", "宝妈", "带娃", "家庭", "被拒", "焦虑", "自我", "身份", "歧视", "偏见"],
    targetShare: 0.15,
  },
  {
    code: "E",
    name: "工具测评",
    keywords: ["AI", "大模型", "免费", "订阅", "涨价", "上线", "更新", "封号", "限制"],
    targetShare: 0.1,
  },
];

/** 采集用的赛道关键词 */
export const SEARCH_KEYWORDS = [
  "宝妈 AI 副业",
  "全职妈妈 重返职场",
  "AI 接单",
  "简历 空窗期",
  "AI 副业 骗局",
];

/** 打分与筛选的阈值。调这里比改代码安全。 */
export const THRESHOLDS = {
  /** 相关度低于此值直接丢弃——热榜绝大多数内容与账号无关 */
  minRelevance: 0.15,
  /** 增速超过此值算 spike */
  spikeVelocity: 0.5,
  /** 出现快照数达到此值算 sustained（持续热点，适合做深度） */
  sustainedAppearances: 3,
  /** 每次推送几条建议 */
  suggestionCount: 5,
  /** 送进 DeepSeek 的信号条数上限，控制 token */
  maxSignalsToLLM: 25,
  /** 与近期已推送选题的相似度超过此值就跳过，避免天天推同一个 */
  dedupeSimilarity: 0.6,
  /** 去重回看多少天 */
  dedupeLookbackDays: 14,
} as const;

/**
 * 否决清单。
 * 这是**确定性检查**，跑在 DeepSeek 输出之后——模型再怎么飘，
 * 也不能让割韭菜话术进到推送卡片里。
 */
export const VETO_RULES: { name: string; test: RegExp; why: string }[] = [
  { name: "收益承诺", test: /月入过万|日入\d|轻松赚|躺赚|被动收入|睡后收入/, why: "骗局通用话术，用了就被归类" },
  { name: "零门槛承诺", test: /人人可做|零基础也能|谁都能|无门槛|包教包会/, why: "「人人可做」是骗局标配" },
  { name: "稀缺施压", test: /名额有限|仅限|错过就没|最后\d+个/, why: "制造决策压力，与信任人设冲突" },
  { name: "宏大叙事", test: /风口|红利期|弯道超车|逆袭|翻身/, why: "用叙事替代具体方法" },
  { name: "技术腔", test: /prompt 工程|参数量|模型架构|token|微调/i, why: "受众要的是能不能用，不是怎么实现" },
];
