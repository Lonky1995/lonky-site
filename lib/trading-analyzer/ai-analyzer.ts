import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type {
  Trade, TradeStats,
  HabitsAnalysis, MoneyManagementAnalysis, TimingAnalysis, DisciplineAnalysis, Diagnosis,
} from './types';

const deepseek = createOpenAICompatible({
  name: 'deepseek',
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

const model = deepseek.chatModel('deepseek-chat');

async function aiJson<T>(system: string, user: string): Promise<T> {
  const { text } = await generateText({
    model,
    system: system + '\n\n请严格返回 JSON，不要包含 markdown 代码块或其他文字。',
    prompt: user,
  });

  const raw = text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON in AI response: ${raw.slice(0, 200)}`);
  }
  return JSON.parse(jsonMatch[0]) as T;
}

// --- Step 2A: Trading Habits ---
export async function analyzeHabits(stats: TradeStats, trades: Trade[]): Promise<HabitsAnalysis> {
  const system = `你是一位资深加密货币交易分析师。分析交易者的习惯数据并给出评估。

要求：
1. 必须引用具体数据，如"你的做多胜率 X% vs 做空胜率 Y%，差距 Z%"
2. 建议必须给出具体阈值，如"建议将最大持仓时间控制在 N 小时以内"
3. 按交易对/方向/时间段给出详细分析

返回 JSON:
{
  "traderType": "scalper/day_trader/swing_trader/position_trader 的中文描述",
  "positionManagementScore": 0-100,
  "riskControlScore": 0-100,
  "detailedBreakdown": {
    "bestSymbol": { "symbol": "BTC", "reason": "胜率62%且盈亏比1.8" },
    "worstSymbol": { "symbol": "SOL", "reason": "7笔全亏，累计-$420" },
    "directionBias": "做多明显优于做空，建议减少逆势做空"
  },
  "suggestions": ["引用具体数据的建议1", "建议2", "建议3"]
}`;

  const input = {
    stats: {
      totalTrades: stats.totalTrades,
      winRate: stats.winRate,
      profitFactor: stats.profitFactor,
      avgHoldDuration: stats.avgHoldDuration,
      avgLeverage: stats.avgLeverage,
      leverageStdDev: stats.leverageStdDev,
      stopLossRate: stats.stopLossRate,
      takeProfitRate: stats.takeProfitRate,
      bySymbol: stats.bySymbol,
      bySide: stats.bySide,
      holdDurationBuckets: stats.holdDurationBuckets,
    },
    recentTrades: trades.slice(0, 30).map(t => ({
      symbol: t.symbol,
      side: t.side,
      pnl: t.realized_pnl,
      pnl_percent: t.pnl_percent,
      hold_duration_min: Math.round((t.hold_duration ?? 0) / 60),
    })),
  };

  return aiJson<HabitsAnalysis>(system, JSON.stringify(input, null, 2));
}

// --- Step 2B: Money Management ---
export async function analyzeMoneyManagement(trades: Trade[]): Promise<MoneyManagementAnalysis> {
  const system = `你是一位量化风险管理专家。分析交易者的资金管理和仓位控制。

关注点：
1. 单笔最大亏损 vs 平均亏损 — 是否存在失控的大亏
2. 仓位大小一致性 — 是否因为情绪随意改变仓位
3. 最大回撤序列 — 连续亏损的累计金额和恢复情况
4. 盈亏比效率 — 盈利单平均赚多少 vs 亏损单平均亏多少
5. 杠杆使用模式 — 杠杆是否在亏损后增加（危险信号）

必须引用具体数据（如"你的最大单笔亏损 $X 是平均亏损的 Y 倍"）
必须给出量化建议（如"建议单笔风险不超过 $X 或账户的 Y%"）

返回 JSON:
{
  "maxDrawdownStreak": { "trades": number, "totalLoss": number, "period": "X月X日-X月X日" },
  "avgWinAmount": number,
  "avgLossAmount": number,
  "largestWin": number,
  "largestLoss": number,
  "winLossRatio": number,
  "positionSizeConsistency": 0-100,
  "leverageAfterLoss": "increasing/stable/decreasing",
  "moneyManagementScore": 0-100,
  "criticalIssues": ["具体问题描述+数据"],
  "rules": ["量化规则建议，如'单笔止损不超过$200'"]
}`;

  const sorted = [...trades].filter(t => t.close_time).sort((a, b) => a.open_time - b.open_time);
  const input = sorted.slice(0, 80).map(t => ({
    open_time: new Date(t.open_time).toISOString(),
    symbol: t.symbol,
    side: t.side,
    quantity: t.quantity,
    leverage: t.leverage,
    notional: t.notional_value,
    pnl: t.realized_pnl,
    pnl_percent: t.pnl_percent,
    fee: t.fee,
  }));

  return aiJson<MoneyManagementAnalysis>(system, JSON.stringify(input, null, 2));
}

// --- Step 2C: Timing ---
export async function analyzeTiming(trades: Trade[]): Promise<TimingAnalysis> {
  const system = `你是一位交易时机分析专家。基于交易记录分析择时能力。

分析维度：
1. 哪些时段交易最频繁？哪些时段胜率最高？两者是否匹配？
2. 交易持仓时间是否合理？盈利单是否拿得太短（过早止盈）？亏损单是否拿得太长（不愿止损）？
3. 连续交易间隔 — 上一笔结束到下一笔开始的时间，是否太仓促？
4. 特定时间段的表现差异（亚盘 0-8 UTC / 欧盘 8-16 UTC / 美盘 16-24 UTC）

必须引用具体数据。

返回 JSON:
{
  "holdTimeAnalysis": {
    "winAvgHold": "2.3h",
    "lossAvgHold": "5.1h",
    "verdict": "亏损单平均持仓是盈利单的2.2倍，典型的'不愿止损'模式"
  },
  "sessionPerformance": {
    "asia": { "count": 12, "winRate": 0.58, "avgPnl": 45 },
    "europe": { "count": 8, "winRate": 0.25, "avgPnl": -120 },
    "us": { "count": 23, "winRate": 0.61, "avgPnl": 89 }
  },
  "tradeIntervalAnalysis": "上一笔亏损后平均3分钟就开新仓（共X次），建议...",
  "timingSuggestions": ["具体建议1", "建议2"]
}`;

  const sorted = [...trades].filter(t => t.close_time).sort((a, b) => a.open_time - b.open_time);
  const input = sorted.slice(0, 60).map(t => ({
    open_time: new Date(t.open_time).toISOString(),
    close_time: t.close_time ? new Date(t.close_time).toISOString() : null,
    side: t.side,
    symbol: t.symbol,
    pnl: t.realized_pnl,
    pnl_percent: t.pnl_percent,
    hold_duration_sec: t.hold_duration,
  }));

  return aiJson<TimingAnalysis>(system, JSON.stringify(input, null, 2));
}

// --- Step 2D: Discipline ---
export async function analyzeDiscipline(trades: Trade[], enrichedTrades?: any[]): Promise<DisciplineAnalysis> {
  const system = `你是一位资深交易心理学专家和行为金融学研究者。你的任务是深度剖析交易序列中的情绪和纪律问题，像一位严厉但有建设性的交易教练一样给出诊断。

每笔交易都附带了开仓时的市场环境数据（market 字段），包含以下指标:

技术面:
- rsi14: 1h级别RSI-14（>70超买，<30超卖，50中性）
- macd: {macd, signal, histogram}（histogram>0看涨动能，<0看跌动能）
- bollingerPosition: 布林带位置（"above_upper"=突破上轨超买, "upper_half"=偏强, "lower_half"=偏弱, "below_lower"=突破下轨超卖）
- priceChange1h: 过去1小时价格变化%
- priceChange4h: 过去4小时价格变化%

资金面:
- fundingRate: 资金费率（正=多头付费/多头拥挤，负=空头付费/空头拥挤，>0.05%=极端看多，<-0.05%=极端看空）
- openInterest: 持仓量（USDT）
- oiChange4h: 过去4h持仓量变化%（正=新资金入场，负=资金退出）
- longShortRatio: 多空账户比（>1=多头账户多，<1=空头账户多，可作为散户情绪的反向指标）
- takerBuySellRatio: 主动买/卖比（>1=主动买入为主/看涨，<1=主动卖出为主/看跌）

检测以下模式:
1. 追涨杀跌: RSI>70+布林带above_upper时追多，或RSI<30+below_lower时追空。结合MACD动能和OI判断是否在极端位置追入
2. 报复性交易: 亏损后立即开新仓（间隔<10分钟），尤其是反向开仓
3. 连亏后加仓: 连续亏损后增大仓位（对比前几笔quantity）
4. 逆势交易: MACD histogram明确看跌+takerBuySellRatio<0.8时做多，或反之做空。资金费率极端时逆势
5. 频繁交易: 1小时内多笔交易

flaggedTrades 的 detail 字段是核心输出，必须深度分析，包含以下层次：
1. 【事实还原】完整描述事件链：前一笔交易的品种/方向/盈亏 → 间隔时间 → 本笔交易的方向/仓位/结果
2. 【市场环境】必须引用多个具体指标数值。例如："开仓时RSI=73处于超买区，MACD histogram=-45看跌动能增强，布林带位于上轨上方，主动卖出比=0.7说明卖压主导，多空比=1.3但资金费率0.03%显示多头拥挤——多个信号共振看跌，此时做多严重逆势"
3. 【心理诊断】分析触发这笔交易的可能心理动因（结合前一笔交易结果和市场环境）
4. 【问题本质】结合2-3个市场指标说明为什么此时入场不合理
5. 【正确做法】结合市场指标给出具体建议（如"等RSI回落至50+MACD histogram转正+主动买入比>1再考虑入场"）
6. 【量化影响】实际损失金额

detail 字段应该是 4-6 句话的完整段落，必须引用至少3个具体市场指标数值。

重要：flaggedTrades 中的 time 字段必须使用输入数据中对应交易的 open_time 原始值（ISO 格式），不要自行格式化。

返回 JSON:
{
  "chasingRate": 0-1,
  "revengeTradeRate": 0-1,
  "doubleDownAfterLossRate": 0-1,
  "disciplineScore": 0-100,
  "flaggedTrades": [
    { "time": "2026-02-15T14:30:00.000Z", "type": "revenge", "detail": "前一笔BTC做空亏损$280后仅2分钟就反手做多，仓位增加30%。开仓时RSI=72已处于超买区，1h价格刚上涨1.8%，资金费率0.01%偏多头拥挤，4hOI增长5%显示投机资金持续涌入——这个市场环境下追多风险极高。这是典型的报复性交易叠加FOMO，亏损触发的'损失厌恶'加上看到价格上涨的焦虑，导致在最不利的时机追入。正确做法是等待RSI回落至50附近、价格回调确认支撑后再考虑入场，并将仓位降至标准的50%。这笔交易最终亏$150，两笔合计$430。" }
  ],
  "patterns": ["具体模式+数据支撑"],
  "suggestions": ["具体可操作的建议"]
}`;

  // Use enriched trades with market data if available, otherwise fallback
  const input = enrichedTrades ?? (() => {
    const sorted = [...trades].filter(t => t.close_time).sort((a, b) => a.open_time - b.open_time);
    return sorted.slice(0, 80).map(t => ({
      open_time: new Date(t.open_time).toISOString(),
      close_time: t.close_time ? new Date(t.close_time).toISOString() : null,
      side: t.side,
      symbol: t.symbol.replace('/USDT:USDT', ''),
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      pnl: t.realized_pnl,
      pnl_percent: t.pnl_percent,
      hold_duration_sec: t.hold_duration,
      leverage: t.leverage,
      quantity: t.quantity,
      notional: t.notional_value,
    }));
  })();

  return aiJson<DisciplineAnalysis>(system, JSON.stringify(input, null, 2));
}

// --- Step 3: Synthesis ---
export async function synthesize(
  stats: TradeStats,
  habits: HabitsAnalysis,
  moneyMgmt: MoneyManagementAnalysis,
  timing: TimingAnalysis,
  discipline: DisciplineAnalysis,
): Promise<Diagnosis> {
  const system = `你是一位综合交易顾问。基于多维分析结果，给出综合诊断。

要求：
1. radarScores 为 6 维（新增 moneyManagement）
2. actionItems 每条建议都必须包含具体数字或规则
3. 生成个性化的 tradingRules 交易规则清单

返回 JSON:
{
  "oneLiner": "一句话交易者画像(20字以内)",
  "summary": "200字综合评价",
  "strengths": ["优势+数据支撑"],
  "improvements": ["改进+数据支撑"],
  "actionItems": [
    "连续亏损2笔后强制休息30分钟（你有X次连亏3笔以上）",
    "欧盘时段胜率仅X%，建议不在此时段交易"
  ],
  "tradingRules": [
    "每日最大亏损: $X",
    "单笔最大仓位: X BTC",
    "连亏2笔后冷却: 30min"
  ],
  "riskScore": 0-100 (风险倾向评分，100=极度激进),
  "radarScores": {
    "profitability": 0-100,
    "riskControl": 0-100,
    "discipline": 0-100,
    "timing": 0-100,
    "consistency": 0-100,
    "moneyManagement": 0-100
  }
}`;

  const input = {
    stats_summary: {
      totalTrades: stats.totalTrades,
      winRate: stats.winRate,
      profitFactor: stats.profitFactor,
      avgHoldDuration: stats.avgHoldDuration,
      stopLossRate: stats.stopLossRate,
      maxConsecutiveLosses: stats.maxConsecutiveLosses,
      totalPnl: Object.values(stats.byExchange).reduce((s, e) => s + e.totalPnl, 0),
    },
    habits,
    moneyManagement: moneyMgmt,
    timing,
    discipline,
  };

  return aiJson<Diagnosis>(system, JSON.stringify(input, null, 2));
}
