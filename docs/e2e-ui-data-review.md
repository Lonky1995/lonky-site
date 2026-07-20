# UI + 数据端到端 Review（2026-07-19）

## 重构范围

全站 Apple-like 壳（深色、毛玻璃导航、统一 PageShell/卡片）：

| 页面 | 状态 |
|------|------|
| `/` | 已重构 |
| `/projects` | 已重构 |
| `/blog` | 已重构 |
| `/blog/[slug]` | 已重构 + prose-dark |
| `/portfolio` | 已重构 |
| `/podcast-notes` | 已重构 |
| `/podcast-notes/[slug]` | 已重构 + prose-dark |
| `/podcast-notes/new` | 已重构 |
| `/tools/trading-analyzer` | 壳已统一 |
| `/menu` `/menu/history` | 已重构 |
| `/dashboard/cpo` | 壳已统一（看板内部组件未全量改） |
| `/wechat` | 已重构 |
| `/hello` | 已重构 |
| sign-in/up | 未改（Clerk） |

## UI Review 问题与修复

| # | 问题 | 修复 |
|---|------|------|
| 1 | 样式未进 CSS 包，页面纯文本 | 内联 apple-theme 到 globals.css，重启 dev |
| 2 | `data-reveal` 默认透明导致空白 | 默认可见 + fail-open |
| 3 | 底部浅灰渐变蒙版挡字 | 改为纯深色底 |
| 4 | 列表/文章页仍旧奶油风 | Section/BlogCard/ProjectCard/PageShell 统一 |
| 5 | 文章 prose 在深色底不可读 | 增加 `.prose-dark` |

## 数据 E2E Review

| 接口 | 结果 | 处理 |
|------|------|------|
| `GET /data/portfolio-latest.json` | 200，ORCL/VELO 持仓 | OK |
| `GET /data/latest-briefing.json` | 200 | OK |
| `GET /data/latest-youtube.json` | 200 | OK |
| `GET /data/latest-wechat.json` | 200 | OK |
| `GET /api/portfolio/quotes?symbols=BTC` | 200 | OK |
| `GET /api/portfolio/quotes?symbols=ORCL,VELO` | 原 502 | **已修**：无 FMP key 时 200+warning |
| `GET /api/portfolio/briefs` | 原 502/401 | **已修**：降级 200+error 文案；支持 GITHUB_SITE_TOKEN |
| `GET /api/dashboard/quotes` | 503 无 FMP | 本地缺 `FMP_API_KEY`（配置问题） |
| validate 路由 | VELO 误判 crypto | **已修**：VELO 为美股 |

## 仍依赖本地/线上环境的项（非代码 bug）

1. **`FMP_API_KEY`**：美股/ORCL/VELO 实时价需要；未配时 UI 显示「行情未接入」。
2. **`GITHUB_TOKEN` 读 `My-vault`**：简报 API 401 表示 token 无该私仓权限；需 fine-grained/classic token 勾选 repo 读权限。
3. **CPO 看板内部**：仍偏原组件风格，仅外层进了深色壳。

## 本地验证

```bash
cd /Users/lonky/lonky-site && npm run dev
# http://localhost:3000
```

`npm run build` 已通过。
