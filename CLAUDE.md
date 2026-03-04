# lonky-site

Lonky 的个人网站，部署在 https://lonky.me

## 技术栈

- **框架**: Next.js 16 (App Router, Turbopack)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **内容管理**: Velite（Markdown → 类型安全数据）
- **AI 集成**: Vercel AI SDK + OpenAI compatible API
- **部署**: Vercel

## 项目结构

```
app/                    # Next.js App Router 页面
├── api/podcast/        # Podcast 相关 API（chat/discuss/parse/publish/transcribe）
├── api/tools/          # 工具类 API
├── blog/               # 博客页面
├── projects/           # 项目展示页面
├── podcast-notes/      # 播客笔记页面（创建/详情）
├── tools/              # 在线工具（trading-analyzer）
└── wechat/             # 微信相关页面
components/             # React 组件
├── podcast/            # Podcast 功能组件（ChatPanel, PodcastCreator 等）
├── trading-analyzer/   # 交易分析器组件
├── blog/ home/ about/ projects/ layout/ ui/
content/                # Velite 管理的 Markdown 内容
├── blog/               # 博客文章
└── podcast-notes/      # 播客笔记
data/                   # 静态数据
├── discussions/        # 播客讨论 JSON 数据
├── site-config.ts      # 站点全局配置
├── projects.ts         # 项目列表数据
└── experience.ts       # 工作经历数据
lib/                    # 工具库
├── podcast/            # Podcast 业务逻辑（auth, discussions）
└── trading-analyzer/   # 交易分析器逻辑
i18n/                   # 国际化（中/英）
scripts/                # 自动化脚本
├── sync-briefing.sh    # 同步每日简报
├── sync-tweet.py       # 同步推文
├── sync-wechat.py      # 同步微信内容
├── sync-vault.ts       # 同步到 Obsidian Vault
└── auto-push.sh        # 自动推送
```

## 开发命令

```bash
npm run dev             # 启动开发服务器（velite + next dev）
npm run build           # 构建生产版本（velite + next build）
npm run lint            # ESLint 检查
npm run test:podcast    # 运行 podcast 相关测试
npm run sync            # 同步内容到 Obsidian Vault
```

## 关键约定

- **国际化**: 通过 middleware 检测 `accept-language` 设置 locale cookie（zh/en）
- **内容发布**: 博客和播客笔记均为 Markdown 文件，放在 `content/` 目录，由 Velite 在构建时处理
- **Podcast 流程**: 解析音频 → 转录 → AI 讨论 → 发布为笔记
- **数据文件**: `data/discussions/*.json` 存储播客讨论的结构化数据
- **样式**: 使用 Tailwind CSS v4，全局样式在 `app/globals.css`
- **组件**: 按功能模块组织在 `components/` 下，通用 UI 组件在 `components/ui/`

## 注意事项

- 修改 `content/` 下的 Markdown 后需要重新构建 Velite（`npm run dev` 会自动处理）
- `data/site-config.ts` 包含站点元信息和社交链接，修改后全站生效
- API 路由在 `app/api/` 下，podcast 相关 API 需要认证（`lib/podcast/auth.ts`）

---

<!-- gitnexus:start -->
# GitNexus MCP

This project is indexed by GitNexus as **lonky-site** (516 symbols, 1027 relationships, 35 execution flows).

GitNexus provides a knowledge graph over this codebase — call chains, blast radius, execution flows, and semantic search.

## Always Start Here

For any task involving code understanding, debugging, impact analysis, or refactoring, you must:

1. **Read `gitnexus://repo/{name}/context`** — codebase overview + check index freshness
2. **Match your task to a skill below** and **read that skill file**
3. **Follow the skill's workflow and checklist**

> If step 1 warns the index is stale, run `npx gitnexus analyze` in the terminal first.

## Skills

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/refactoring/SKILL.md` |

## Tools Reference

| Tool | What it gives you |
|------|-------------------|
| `query` | Process-grouped code intelligence — execution flows related to a concept |
| `context` | 360-degree symbol view — categorized refs, processes it participates in |
| `impact` | Symbol blast radius — what breaks at depth 1/2/3 with confidence |
| `detect_changes` | Git-diff impact — what do your current changes affect |
| `rename` | Multi-file coordinated rename with confidence-tagged edits |
| `cypher` | Raw graph queries (read `gitnexus://repo/{name}/schema` first) |
| `list_repos` | Discover indexed repos |

## Resources Reference

Lightweight reads (~100-500 tokens) for navigation:

| Resource | Content |
|----------|---------|
| `gitnexus://repo/{name}/context` | Stats, staleness check |
| `gitnexus://repo/{name}/clusters` | All functional areas with cohesion scores |
| `gitnexus://repo/{name}/cluster/{clusterName}` | Area members |
| `gitnexus://repo/{name}/processes` | All execution flows |
| `gitnexus://repo/{name}/process/{processName}` | Step-by-step trace |
| `gitnexus://repo/{name}/schema` | Graph schema for Cypher |

## Graph Schema

**Nodes:** File, Function, Class, Interface, Method, Community, Process
**Edges (via CodeRelation.type):** CALLS, IMPORTS, EXTENDS, IMPLEMENTS, DEFINES, MEMBER_OF, STEP_IN_PROCESS

```cypher
MATCH (caller)-[:CodeRelation {type: 'CALLS'}]->(f:Function {name: "myFunc"})
RETURN caller.name, caller.filePath
```

<!-- gitnexus:end -->
