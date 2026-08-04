/**
 * 选题 agent 的数据形状。
 *
 * 核心设计：一次性调研看「绝对值」，持续监控看「变化率」。
 * 所以最小存储单元是**快照**（某个时刻的榜单切片），而不是一张平表。
 * 没有历史快照就算不出增速，算不出增速就只能看见已经爆完的内容。
 */

/** 榜单/搜索结果里的一条 */
export interface TrendItem {
  /** 来源标识，如 "douyin-hot" / "xhs-search:宝妈AI副业" */
  sourceId: string;
  /**
   * 跨快照追踪用的稳定键。由标题归一化而来——平台的 id 经常变，
   * 但话题文本相对稳定，所以用文本做键更可靠。
   */
  key: string;
  title: string;
  /** 平台给的热度值；没有的话由互动数合成 */
  heat: number;
  rank?: number;
  url?: string;
  capturedAt: string;
}

/** 一次运行采到的全部内容 */
export interface Snapshot {
  runId: string;
  capturedAt: string;
  items: TrendItem[];
}

export type SignalKind = "spike" | "newcomer" | "rising" | "sustained";

/** 信号层的产出：值得看一眼的话题 */
export interface Signal {
  key: string;
  title: string;
  sourceId: string;
  url?: string;
  heat: number;
  kind: SignalKind;
  /** 相对上次快照的热度增速（0.5 = 涨了 50%） */
  velocity: number;
  /** 在最近的历史里出现过几次快照 */
  appearances: number;
  /** 与账号栏目的相关度 0–1。大部分热榜是娱乐八卦，这一项负责筛掉 */
  relevance: number;
  score: number;
  /** 人能读懂的入选理由，会带进推送卡片 */
  reasons: string[];
}

/** DeepSeek 产出的选题建议 */
export interface TopicSuggestion {
  title: string;
  /** 切入角度：同一个热点，她该怎么讲才是她的 */
  angle: string;
  /** 开头三秒钩子 */
  hook: string;
  /** 归属栏目 code，如 "A" */
  pillar: string;
  /** 为什么是现在——热点的时效性理由 */
  whyNow: string;
  /** 关联的信号 key，用于回溯和去重 */
  sourceKeys: string[];
}

/** 一次运行的完整产出 */
export interface RunResult {
  runId: string;
  ranAt: string;
  itemsCollected: number;
  signals: Signal[];
  suggestions: TopicSuggestion[];
  /** 被否决清单拦下的建议，保留下来便于调词典 */
  rejected: { suggestion: TopicSuggestion; reason: string }[];
}
