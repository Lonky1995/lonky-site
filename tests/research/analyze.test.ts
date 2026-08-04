import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, toMarkdown } from "../../scripts/xhs-research/analyze";
import type { Dataset, Note } from "../../scripts/xhs-research/types";

/**
 * 合成数据，不是真实抓取结果。
 * 只用来验证分析器的计算和分类逻辑，不代表任何市场结论。
 */
function note(p: Partial<Note> & { title: string }): Note {
  return {
    id: Math.random().toString(16).slice(2).padEnd(24, "0"),
    author: "某宝妈",
    likes: 100,
    collects: 20,
    comments: 10,
    tags: [],
    type: "video",
    url: "https://www.xiaohongshu.com/explore/x",
    keyword: "宝妈 AI 副业",
    collectedAt: "2026-08-04T00:00:00.000Z",
    ...p,
  };
}

const dataset: Dataset = {
  keywords: ["宝妈 AI 副业", "全职妈妈 重返职场"],
  collectedAt: "2026-08-04T00:00:00.000Z",
  notes: [
    // 第一人称 + 金额 + 时间跨度：应当同时命中三个模式
    note({ title: "我用AI接单的第一个月，赚了437块", likes: 3200, collects: 900, comments: 210 }),
    note({ title: "我花了23天才赚到第一笔钱", likes: 1800, collects: 400, comments: 150 }),
    note({ title: "我试了8个AI工具，只留下2个", likes: 900, collects: 620, comments: 40 }),
    // 收益承诺 + 骗局话术：应当同时命中 TITLE 的收益承诺和 RISK 的多条
    note({ title: "零基础宝妈月入过万，人人可做的躺赚项目", likes: 60, collects: 5, comments: 3 }),
    note({ title: "内部渠道！日结300，名额有限", likes: 30, collects: 2, comments: 1 }),
    // 避坑
    note({ title: "别买AI课！我扒了100条投诉揭秘套路", likes: 5400, collects: 1200, comments: 890 }),
    note({ title: "这5句话一出现就是割韭菜", likes: 2100, collects: 700, comments: 320 }),
    // 痛点 / 情绪，评论比高
    note({
      title: "面试官问我空窗期，我这样回答",
      likes: 1500,
      collects: 200,
      comments: 1100,
      keyword: "全职妈妈 重返职场",
      publishedAt: "2026-07-02T20:15:00.000Z",
    }),
    note({
      title: "全职三年，我最怕别人问你平时在家干嘛",
      likes: 2600,
      collects: 180,
      comments: 1900,
      keyword: "全职妈妈 重返职场",
      publishedAt: "2026-07-03T21:40:00.000Z",
    }),
    // 教程，收藏比高
    note({
      title: "保姆级教程：用AI做一份能拿去面试的作品集",
      likes: 800,
      collects: 1400,
      comments: 60,
      type: "image",
      keyword: "全职妈妈 重返职场",
      publishedAt: "2026-07-04T09:05:00.000Z",
    }),
    // 清单体，跑输
    note({ title: "5个宝妈必备AI工具推荐", likes: 120, collects: 40, comments: 8, type: "image" }),
    note({ title: "10款免费AI神器分享", likes: 90, collects: 30, comments: 5, type: "image" }),
    // 边界：零点赞，不能让比值计算炸掉
    note({ title: "我做了一个小测试", likes: 0, collects: 0, comments: 0 }),
  ],
};

test("汇总统计与分组正确", () => {
  const a = analyze(dataset);
  assert.equal(a.summary.total, 13);
  assert.equal(a.summary.byKeyword["宝妈 AI 副业"], 10);
  assert.equal(a.summary.byKeyword["全职妈妈 重返职场"], 3);
  assert.equal(a.summary.byType.image, 3);
  assert.equal(a.summary.byType.video, 10);
  assert.ok(a.summary.medianLikes > 0);
});

test("标题模式能识别第一人称实录并给出中位赞", () => {
  const a = analyze(dataset);
  const first = a.titlePatterns.find((p) => p.name === "第一人称实录");
  assert.ok(first, "应存在第一人称实录模式");
  assert.ok(first!.count >= 4, `命中数应 >=4，实际 ${first!.count}`);
  assert.ok(first!.medianLikes > 0);
  assert.ok(first!.examples.length > 0);
  // examples 按点赞降序
  assert.equal(first!.examples[0], "我用AI接单的第一个月，赚了437块");
});

test("割韭菜话术能被识别，且集中在低赞笔记", () => {
  const a = analyze(dataset);
  const risky = a.riskPhrases.filter((p) => p.count > 0);
  assert.ok(risky.length >= 3, `应命中多条风险话术，实际 ${risky.length}`);

  const zero = a.riskPhrases.find((p) => p.name === "零门槛承诺");
  assert.ok(zero && zero.count >= 1);
  // 合成数据里骗局款点赞都很低，中位赞应显著低于大盘
  assert.ok(
    zero!.medianLikes < a.summary.medianLikes,
    `风险话术中位赞 ${zero!.medianLikes} 应低于大盘 ${a.summary.medianLikes}`,
  );
});

test("痛点词覆盖重返职场相关内容", () => {
  const a = analyze(dataset);
  const gap = a.painPhrases.find((p) => p.name === "简历空窗");
  assert.ok(gap && gap.count >= 1, "应识别出简历空窗痛点");
});

test("互动比分位数计算正确且不被零点赞击穿", () => {
  const a = analyze(dataset);
  const { collectRatio, commentRatio } = a.engagement;
  for (const q of [collectRatio, commentRatio]) {
    assert.ok(Number.isFinite(q.p25) && Number.isFinite(q.p50) && Number.isFinite(q.p75));
    assert.ok(q.p25 <= q.p50 && q.p50 <= q.p75, "分位数应单调不减");
  }
  // 教程款收藏比 1.75，应把 P75 顶起来
  assert.ok(collectRatio.p75 > 0.3, `收藏比 P75 偏低: ${collectRatio.p75}`);
});

test("Top 榜按维度区分：教程上收藏榜，情绪上评论榜", () => {
  const a = analyze(dataset);
  const topCollect = a.topNotes.byCollectRatio[0];
  assert.match(topCollect.title, /作品集/, `收藏榜首应为教程款，实际: ${topCollect.title}`);

  const topComment = a.topNotes.byCommentRatio[0];
  assert.match(topComment.title, /全职三年|空窗期/, `评论榜首应为情绪款，实际: ${topComment.title}`);

  // 低赞噪声不应进榜
  assert.ok(
    !a.topNotes.byCollectRatio.some((n) => n.title === "内部渠道！日结300，名额有限"),
    "低量级笔记不应进入 Top 榜",
  );
});

test("高频表述能浮出反复出现的说法", () => {
  const a = analyze(dataset);
  assert.ok(a.phrases.length > 0, "应抽出高频表述");
  // 停用词不应出现
  assert.ok(!a.phrases.some((p) => p.phrase === "的"), "停用词不应入榜");
});

test("发布时间分布只统计有时间戳的笔记", () => {
  const a = analyze(dataset);
  const total = a.publishClock.reduce((s, p) => s + p.count, 0);
  assert.equal(total, 3, `只有 3 篇带时间戳，实际统计 ${total}`);
});

test("Markdown 报告包含各主要章节且无 NaN", () => {
  const a = analyze(dataset);
  const md = toMarkdown(a, dataset);
  for (const section of [
    "内容形态分布",
    "标题结构",
    "互动结构",
    "割韭菜话术渗透率",
    "痛点覆盖度",
    "Top 笔记",
  ]) {
    assert.ok(md.includes(section), `报告缺少章节: ${section}`);
  }
  assert.ok(!md.includes("NaN"), "报告不应出现 NaN");
  assert.ok(!md.includes("Infinity"), "报告不应出现 Infinity");
});

test("空数据集不炸", () => {
  const empty: Dataset = { keywords: [], collectedAt: "", notes: [] };
  const a = analyze(empty);
  assert.equal(a.summary.total, 0);
  const md = toMarkdown(a, empty);
  assert.ok(!md.includes("NaN"));
});
