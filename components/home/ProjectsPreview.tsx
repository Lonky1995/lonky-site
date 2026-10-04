"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
const order = ["clayyard", "agent", "xhs", "podcast"];
export function ProjectsPreview() {
  const host = useRef<HTMLElement>(null);
  const [active, setActive] = useState("clayyard");
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [cycle, setCycle] = useState(0);
  function choose(kind: string) {
    setActive(kind);
    setCycle((value) => value + 1);
  }
  function onKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = order.indexOf(active);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? order.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + order.length) %
            order.length;
    choose(order[next]);
    host.current
      ?.querySelector<HTMLButtonElement>(`#work-tab-${order[next]}`)
      ?.focus();
  }
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    function sync() {
      clearTimeout(timer);
      if (!visible || paused || document.hidden || reduced.matches) return;
      timer = setTimeout(
        () =>
          setActive(
            (value) => order[(order.indexOf(value) + 1) % order.length],
          ),
        3000,
      );
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        el?.classList.toggle("in-view", visible);
        sync();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [active, paused, cycle]);
  return (
    <section className="section work-showcase in-view" id="work" ref={host}>
      <div className="showcase-heading reveal" data-reveal="">
        <div>
          <h2>{"从想法，到能用。"}</h2>
          <p>{"每个项目，都从一个真实的问题开始。"}</p>
        </div>
      </div>
      <div
        className="showcase-tabs reveal"
        role="tablist"
        aria-label="精选作品"
        data-reveal=""
        onKeyDown={onKeys}
      >
        <button
          type="button"
          id="work-tab-clayyard"
          role="tab"
          aria-controls="work-panel-clayyard"
          data-project="clayyard"
          aria-selected={active === "clayyard"}
          onClick={() => choose("clayyard")}
          tabIndex={active === "clayyard" ? 0 : -1}
        >
          <span>{"01"}</span>
          {"ClayYard "}
          <small>{"开发中"}</small>
        </button>
        <button
          type="button"
          id="work-tab-agent"
          role="tab"
          aria-controls="work-panel-agent"
          data-project="agent"
          aria-selected={active === "agent"}
          onClick={() => choose("agent")}
          tabIndex={active === "agent" ? 0 : -1}
        >
          <span>{"02"}</span>
          {"LonkyClaw "}
          <small>{"AI / HARNESS"}</small>
        </button>
        <button
          type="button"
          id="work-tab-xhs"
          role="tab"
          aria-controls="work-panel-xhs"
          data-project="xhs"
          aria-selected={active === "xhs"}
          onClick={() => choose("xhs")}
          tabIndex={active === "xhs" ? 0 : -1}
        >
          <span>{"03"}</span>
          {"小红书工具 "}
          <small>{"AI / WORKFLOW"}</small>
        </button>
        <button
          type="button"
          id="work-tab-podcast"
          role="tab"
          aria-controls="work-panel-podcast"
          data-project="podcast"
          aria-selected={active === "podcast"}
          onClick={() => choose("podcast")}
          tabIndex={active === "podcast" ? 0 : -1}
        >
          <span>{"04"}</span>
          {"播客笔记 "}
          <small>{"AI / KNOWLEDGE"}</small>
        </button>
      </div>
      <div className="showcase-stage reveal" data-reveal="">
        <article
          id="work-panel-clayyard"
          role="tabpanel"
          aria-labelledby="work-tab-clayyard"
          data-kind="clayyard"
          className={
            active === "clayyard" ? "project-panel active" : "project-panel"
          }
          hidden={active !== "clayyard"}
        >
          <div className="project-copy">
            <span className="project-category">
              {"DATA & TOOLS FOR YOUR AGENT"}
            </span>
            <h3>
              {"ClayYard"}
              <span className="project-dot">{"."}</span>
              <span className="development-badge">{"开发中"}</span>
            </h3>
            <p className="project-tagline">
              {"一个 MCP，"}
              <br />
              {"连接数据与工具。"}
            </p>
            <p className="project-description">
              {
                "为你的 Agent 构建统一的数据与工具入口。围绕市场研究、客户研究与电商任务，连接不同来源，让请求、调用和返回结果有迹可循。"
              }
            </p>
            <span className="project-note">{"开发中，敬请期待"}</span>
            <span className="project-note">
              {"Agent 数据与工具接入层 / 开发中"}
            </span>
          </div>
          <div
            className="project-art clayyard-art"
            aria-label="ClayYard 概念动画：你的 Agent 通过一个 MCP 连接多个数据与工具来源"
          >
            <div className="art-grid"></div>
            <div className="clayyard-art-label">
              {"YOUR AGENT. CONNECTED."}
              <span>{"ONE MCP ENTRY"}</span>
            </div>
            <div className="clayyard-routing">
              <svg viewBox="0 0 520 300" aria-hidden="true">
                <path
                  className="routing-base"
                  d="M70 150 H270 M270 150 H325 Q340 150 340 130 V65 H450 M270 150 H450 M270 150 H325 Q340 150 340 170 V235 H450"
                ></path>
                <path
                  className="routing-packet"
                  d="M70 150 H270 M270 150 H325 Q340 150 340 130 V65 H450 M270 150 H450 M270 150 H325 Q340 150 340 170 V235 H450"
                ></path>
              </svg>
              <div className="clayyard-user">
                <span>{"你的 Agent"}</span>
                <small>{"提出任务"}</small>
              </div>
              <div className="clayyard-hub">
                <span>{"ClayYard"}</span>
                <strong>{"MCP"}</strong>
                <small>{"统一接入"}</small>
              </div>
              <div className="clayyard-sources">
                <div>
                  {"市场数据"}
                  <small>{"FINANCE"}</small>
                </div>
                <div>
                  {"客户研究"}
                  <small>{"GTM"}</small>
                </div>
                <div>
                  {"电商工具"}
                  <small>{"COMMERCE"}</small>
                </div>
              </div>
            </div>
            <div className="clayyard-receipt">
              <span>{"↳"}</span>
              {" 返回结果 "}
              <i>{"·"}</i>
              {" 留下调用记录"}
            </div>
          </div>
        </article>
        <article
          id="work-panel-agent"
          role="tabpanel"
          aria-labelledby="work-tab-agent"
          data-kind="agent"
          className={
            active === "agent" ? "project-panel active" : "project-panel"
          }
          hidden={active !== "agent"}
        >
          <div className="project-copy">
            <span className="project-category">
              {"PERSONAL RESEARCH HARNESS"}
            </span>
            <h3>
              {"LonkyClaw"}
              <span className="project-dot">{"."}</span>
            </h3>
            <p className="project-tagline">
              {"让研究持续推进，"}
              <br />
              {"让判断有迹可循。"}
            </p>
            <p className="project-description">
              {
                "一个个人市场研究 Harness。把对话中的问题与假设，连接到证据、研究判断、计划检查和复盘；保留每次判断的依据与变化，关键推进由人确认。"
              }
            </p>
            <a
              className="project-link"
              href="https://github.com/Lonky1995/lonkyclaw"
              target="_blank"
              rel="noopener"
            >
              {"查看项目 "}
              <span>{"↗"}</span>
            </a>
            <span className="project-note">
              {"市场研究 Harness / 持续构建"}
            </span>
          </div>
          <div
            className="project-art agent-art"
            aria-label="市场研究 Harness 概念动画：证据、研究判断、计划检查、复盘回看，由用户确认关键推进"
          >
            <div className="art-grid"></div>
            <div className="harness-intro">
              {"从一个市场问题开始 "}
              <span>{"RESEARCH LOOP"}</span>
            </div>
            <div className="harness-loop">
              <svg
                className="harness-path"
                viewBox="0 0 480 300"
                aria-hidden="true"
              >
                <path
                  className="loop-base"
                  d="M100 50 H380 Q430 50 430 100 V200 Q430 250 380 250 H100 Q50 250 50 200 V100 Q50 50 100 50 Z"
                ></path>
                <path
                  className="loop-packet"
                  d="M100 50 H380 Q430 50 430 100 V200 Q430 250 380 250 H100 Q50 250 50 200 V100 Q50 50 100 50 Z"
                ></path>
              </svg>
              <div className="harness-node node-evidence">
                <small>{"01 / EVIDENCE"}</small>
                <strong>{"证据"}</strong>
                <span>{"来源 · 时间 · 支持与反证"}</span>
              </div>
              <div className="harness-node node-thesis">
                <small>{"02 / THESIS"}</small>
                <strong>{"研究判断"}</strong>
                <span>{"候选假设 → 用户确认"}</span>
              </div>
              <div className="harness-center">
                <span>{"LonkyClaw"}</span>
                <strong>{"HARNESS"}</strong>
                <small>{"连接工具 · 保留状态 · 记录变化"}</small>
              </div>
              <div className="harness-node node-review">
                <small>{"04 / REVIEW"}</small>
                <strong>{"复盘回看"}</strong>
                <span>{"回看证据与判断的变化"}</span>
              </div>
              <div className="harness-node node-plan">
                <small>{"03 / DECISION GATE"}</small>
                <strong>{"计划检查"}</strong>
                <span>{"逻辑 · 验证条件 · 失效条件"}</span>
              </div>
            </div>
            <div className="harness-footer">
              {"人确认关键推进 "}
              <span>{"判断与计划，各有依据。"}</span>
            </div>
          </div>
        </article>
        <article
          id="work-panel-xhs"
          role="tabpanel"
          aria-labelledby="work-tab-xhs"
          data-kind="xhs"
          className={
            active === "xhs" ? "project-panel active" : "project-panel"
          }
          hidden={active !== "xhs"}
        >
          <div className="project-copy">
            <span className="project-category">{"RESEARCH & WORKFLOW"}</span>
            <h3>
              {"小红书工具"}
              <span className="project-dot">{"."}</span>
            </h3>
            <p className="project-tagline">
              {"把分散的信息，"}
              <br />
              {"整理成下一步。"}
            </p>
            <p className="project-description">
              {"把关键词采集、评论辅助、舆情研究和线索整理串成一套工作台。"}
            </p>
            <button
              className="project-link project-expand"
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              aria-controls="xhs-project-details"
            >
              {expanded ? "收起介绍 " : "了解项目 "}
              <span>{expanded ? "−" : "＋"}</span>
            </button>
            <p
              className="project-detail"
              hidden={!expanded}
              id="xhs-project-details"
            >
              {
                "整理评论与关键词，辅助生成内容，汇总线索和研究结果。围绕真实任务，把采集、分析与下一步操作连在一起。"
              }
            </p>
            <span className="project-note">{"内容研究工作台 / 持续构建"}</span>
          </div>
          <div className="project-art xhs-art" aria-label="信息整理概念动画">
            <div className="research-label">{"INFORMATION → INSIGHT"}</div>
            <div className="research-inputs">
              <span>{"关键词"}</span>
              <span>{"评论"}</span>
              <span>{"话题"}</span>
              <span>{"线索"}</span>
            </div>
            <div className="research-lens">
              <span>{"整理"}</span>
              <i></i>
            </div>
            <div className="research-result">
              <span>{"下一步"}</span>
              <div>
                <i></i>
                <i></i>
                <i></i>
              </div>
              <small>{"从信息到行动"}</small>
            </div>
          </div>
        </article>
        <article
          id="work-panel-podcast"
          role="tabpanel"
          aria-labelledby="work-tab-podcast"
          data-kind="podcast"
          className={
            active === "podcast" ? "project-panel active" : "project-panel"
          }
          hidden={active !== "podcast"}
        >
          <div className="project-copy">
            <span className="project-category">{"AUDIO TO KNOWLEDGE"}</span>
            <h3>
              {"播客笔记"}
              <span className="project-dot">{"."}</span>
            </h3>
            <p className="project-tagline">
              {"听过的内容，"}
              <br />
              {"留下能用的东西。"}
            </p>
            <p className="project-description">
              {
                "贴一个播客链接，完成转录、整理和深入讨论，让长内容变成可以回看的结构化笔记。"
              }
            </p>
            <Link className="project-link" href="/podcast-notes">
              {"体验工具 "}
              <span>{"↗"}</span>
            </Link>
            <span className="project-note">{"知识整理工具"}</span>
          </div>
          <div
            className="project-art podcast-art"
            aria-label="声音转成笔记的概念动画"
          >
            <div className="audio-block">
              <span>{"LISTEN"}</span>
              <div className="audio-bars">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </div>
            </div>
            <div className="audio-to-note">{"↓"}</div>
            <div className="note-sheet">
              <span>{"把声音，留下来。"}</span>
              <div className="note-line"></div>
              <div className="note-line"></div>
              <div className="note-line"></div>
              <div className="note-tags">
                <span>{"转录"}</span>
                <span>{"整理"}</span>
                <span>{"讨论"}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
      <div className="showcase-controls">
        <button
          type="button"
          id="project-autoplay"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? "继续轮播" : "暂停轮播"}
        </button>
      </div>
    </section>
  );
}
