---
title: "CEG · 美国最大核电运营商的 AI 重估故事"
slug: "ceg-fundamental-analysis"
description: "Constellation Energy 正在被市场从「公用事业股 PE 18x」重新定价为「AI 基建股 PE 36x」。一张卡片看清估值、叙事、Bull/Bear 三件事。"
date: "2026-05-16"
category: "财报分析"
tags: ["美股", "财报分析", "CEG", "核电", "AI"]
coverImage: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&h=800&fit=crop&q=80"
published: true
---

最近开始系统地做一些美股的财报分析，试着用一张卡片把一只股票的关键信息浓缩呈现 —— 估值、叙事进展、机构动作、Bull/Bear case，都放在同一个视野里。这是第一张：**Constellation Energy (CEG)**。

CEG 是美国最大核电运营商，21 座核反应堆，占美国清洁电力约 10%，关键资产包括三里岛 Unit 1、Calvert Cliffs、Limerick。过去 12 个月，市场对这家公司的估值锚正在从「公用事业股 PE 18x」切换到「AI 基建股 PE 36x」—— 同行 AEP / DUK 仍在 18x，CEG 已经定价了「AI 重置」。这个重估能不能站住，是接下来观察的核心。

<p style="margin: 24px 0;">
  <a href="/financials/CEG-card.html" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 0.9rem; font-weight: 500;">
    在新标签打开完整卡片 ↗
  </a>
</p>

<iframe id="ceg-card-frame" src="/financials/CEG-card.html" width="100%" height="3200" style="display: block; width: 100%; border: 1px solid #e5e5e5; border-radius: 8px; background: #fafafa;" loading="lazy" title="CEG Fundamental Analysis Card"></iframe>

<script>
(function () {
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ceg-card-height' && typeof e.data.height === 'number') {
      var f = document.getElementById('ceg-card-frame');
      if (f) f.style.height = e.data.height + 'px';
    }
  });
})();
</script>

---

**Bull**：AI 数据中心电力 PPA 持续签约 + Calpine 收购扩产能 + PJM 容量拍卖 ×2 锁收入 + DOE 贷款担保拿融资，叙事四线共振，机构共识仍在形成中。

**Bear**：PE 35.9x 已经定价了相当一部分预期，TTM 净利率仅 10.6%，债务/权益 0.67，Calpine 整合执行 + 新 PPA 签约速度是下一个验证窗口；如果叙事兑现节奏落后，估值回到 25x 区间是合理的下行风险。

数据来源：FMP（ratios-ttm）、SEC EDGAR（10-K、8-K、S-3ASR、Form 144）。
