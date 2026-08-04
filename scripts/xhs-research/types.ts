/**
 * 小红书竞品笔记的数据形状。
 *
 * collect.ts 抓取后写入这个结构；analyze.ts 只认这个结构。
 * 两者解耦意味着：抓取挂了也可以手工整理数据喂给分析器。
 */

export interface Note {
  /** 笔记 ID（小红书 note id） */
  id: string;
  title: string;
  /** 正文摘要，详情页才有 */
  desc?: string;
  author: string;
  authorId?: string;
  likes: number;
  collects: number;
  comments: number;
  /** 详情页可得，列表页通常没有 */
  publishedAt?: string;
  tags: string[];
  type: "video" | "image";
  url: string;
  coverUrl?: string;
  /** 由哪个搜索词命中，用于对比不同切入词的内容生态 */
  keyword: string;
  collectedAt: string;
}

export interface Dataset {
  keywords: string[];
  collectedAt: string;
  notes: Note[];
}

/** analyze.ts 的输出，同时写 JSON 和 Markdown */
export interface Analysis {
  summary: {
    total: number;
    byKeyword: Record<string, number>;
    byType: Record<string, number>;
    medianLikes: number;
    medianCollects: number;
    medianComments: number;
  };
  titlePatterns: PatternHit[];
  riskPhrases: PatternHit[];
  painPhrases: PatternHit[];
  engagement: {
    /** 收藏/点赞 —— 高 = 工具型内容，吃搜索长尾 */
    collectRatio: Quartiles;
    /** 评论/点赞 —— 高 = 情绪型内容，吃互动破圈 */
    commentRatio: Quartiles;
  };
  phrases: { phrase: string; count: number }[];
  topNotes: {
    byLikes: Note[];
    byCollectRatio: Note[];
    byCommentRatio: Note[];
  };
  publishClock: { hour: number; count: number }[];
}

export interface PatternHit {
  name: string;
  hint: string;
  count: number;
  share: number;
  /** 命中这个模式的笔记的中位点赞，用来判断"这个写法到底有没有用" */
  medianLikes: number;
  examples: string[];
}

export interface Quartiles {
  p25: number;
  p50: number;
  p75: number;
}
