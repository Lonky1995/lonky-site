"use client";

import { useEffect, useMemo, useState } from "react";

type Priority = "core" | "normal" | "idea";

type WatchlistItem = {
  symbol: string;
  market: "US";
  name?: string;
  priority: Priority;
  tags: string[];
  thesis?: string;
  focus: string[];
  enabled: boolean;
  updatedAt: string;
};

type FormState = {
  symbol: string;
  name: string;
  priority: Priority;
  thesis: string;
  focus: string;
};

const EMPTY_FORM: FormState = {
  symbol: "",
  name: "",
  priority: "normal",
  thesis: "",
  focus: "",
};

const PRIORITY_META: Record<Priority, { label: string; hint: string; className: string }> = {
  core: { label: "核心", hint: "持续优先关注", className: "pf-watch-priority-core" },
  normal: { label: "普通", hint: "常规跟踪", className: "pf-watch-priority-normal" },
  idea: { label: "观察", hint: "等待更多证据", className: "pf-watch-priority-idea" },
};

export default function WatchlistPanel() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/portfolio/watchlist?t=${Date.now()}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { items?: WatchlistItem[]; error?: string };
      if (!res.ok) throw new Error(data.error || "关注列表暂时不可用");
      setItems(data.items ?? []);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "关注列表暂时不可用");
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
    setPasscode(sessionStorage.getItem("pf_passcode") || "");
  }, []);

  const counts = useMemo(
    () => ({
      core: items.filter((item) => item.priority === "core").length,
      normal: items.filter((item) => item.priority === "normal").length,
      idea: items.filter((item) => item.priority === "idea").length,
    }),
    [items],
  );

  const beginAdd = () => {
    setEditing("new");
    setForm(EMPTY_FORM);
    setError("");
  };

  const beginEdit = (item: WatchlistItem) => {
    setEditing(item.symbol);
    setForm({
      symbol: item.symbol,
      name: item.name || "",
      priority: item.priority,
      thesis: item.thesis || "",
      focus: item.focus.join("、"),
    });
    setError("");
  };

  const save = async () => {
    const symbol = form.symbol.trim().replace(/^\$/, "").toUpperCase();
    if (!symbol) {
      setError("请输入股票代码");
      return;
    }
    if (!passcode.trim()) {
      setError("请输入 Portfolio 密码后再保存");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/portfolio/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: passcode.trim(),
          symbol,
          name: form.name.trim() || undefined,
          priority: form.priority,
          thesis: form.thesis.trim() || undefined,
          focus: form.focus
            .split(/[、,，\n]/)
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "保存失败");
      sessionStorage.setItem("pf_passcode", passcode.trim());
      setEditing(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (symbol: string) => {
    if (!passcode.trim()) {
      setManageOpen(true);
      setEditing(symbol);
      const item = items.find((candidate) => candidate.symbol === symbol);
      if (item) beginEdit(item);
      setError("请输入 Portfolio 密码后再移除");
      return;
    }
    if (!window.confirm(`从全局关注列表移除 ${symbol}？`)) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/portfolio/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim(), symbol }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "移除失败");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "移除失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="pf-watch" aria-labelledby="watchlist-title">
      <div className="pf-watch-heading">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="watchlist-title">我的关注</h2>
            {status === "ready" && <span className="pf-watch-count">{items.length}</span>}
          </div>
          <p>Coach 与 Personal Agent 会优先关联这些标的。</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setManageOpen((open) => !open);
            setEditing(null);
            setError("");
          }}
          aria-expanded={manageOpen}
        >
          {manageOpen ? "完成" : "管理关注"}
        </button>
      </div>

      <div className="pf-watch-summary" aria-label="关注优先级统计">
        {(Object.keys(PRIORITY_META) as Priority[]).map((priority) => (
          <span key={priority}>
            <b>{counts[priority]}</b> {PRIORITY_META[priority].label}
          </span>
        ))}
      </div>

      {manageOpen && (
        <div className="pf-watch-editor">
          <div className="pf-watch-editor-bar">
            <div>
              <strong>管理模式</strong>
              <span>修改会同步给所有 Agent 和定时任务</span>
            </div>
            <button type="button" className="primary-button" onClick={beginAdd}>
              + 添加标的
            </button>
          </div>
          <label className="pf-watch-passcode">
            <span>Portfolio 密码</span>
            <input
              type="password"
              autoComplete="current-password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              placeholder="写操作需要验证"
            />
          </label>
        </div>
      )}

      {editing && manageOpen && (
        <div className="pf-watch-form" aria-label={editing === "new" ? "添加关注标的" : `编辑 ${editing}`}>
          <div className="pf-watch-form-grid">
            <label>
              <span>股票代码</span>
              <input
                value={form.symbol}
                disabled={editing !== "new"}
                onChange={(event) => setForm((current) => ({ ...current, symbol: event.target.value.toUpperCase() }))}
                placeholder="NVDA"
              />
            </label>
            <label>
              <span>优先级</span>
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as Priority }))}
              >
                {(Object.keys(PRIORITY_META) as Priority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_META[priority].label} · {PRIORITY_META[priority].hint}
                  </option>
                ))}
              </select>
            </label>
            <label className="pf-watch-form-wide">
              <span>关注逻辑（可选）</span>
              <input
                value={form.thesis}
                onChange={(event) => setForm((current) => ({ ...current, thesis: event.target.value }))}
                placeholder="为什么持续关注这个标的"
              />
            </label>
            <label className="pf-watch-form-wide">
              <span>重点验证（可选，用逗号分隔）</span>
              <input
                value={form.focus}
                onChange={(event) => setForm((current) => ({ ...current, focus: event.target.value }))}
                placeholder="数据中心收入、毛利率、订单增速"
              />
            </label>
          </div>
          <div className="pf-watch-form-actions">
            <button type="button" className="secondary-button" onClick={() => setEditing(null)} disabled={submitting}>
              取消
            </button>
            <button type="button" className="primary-button" onClick={save} disabled={submitting}>
              {submitting ? "保存中…" : editing === "new" ? "加入关注" : "保存修改"}
            </button>
          </div>
        </div>
      )}

      <div className="pf-watch-feedback" aria-live="polite">
        {status === "loading" && <span>正在同步全局关注列表…</span>}
        {error && <span className="pf-watch-error">{error}</span>}
      </div>

      {status === "ready" && items.length === 0 && (
        <div className="pf-watch-empty">
          <strong>还没有关注标的</strong>
          <span>加入第一只股票后，Coach 的市场分析会自动优先关联它。</span>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setManageOpen(true);
              beginAdd();
            }}
          >
            添加第一只
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="pf-watch-list">
          {items.map((item) => {
            const meta = PRIORITY_META[item.priority];
            return (
              <article className="pf-watch-row" key={item.symbol}>
                <div className="pf-watch-symbol">
                  <strong>{item.symbol}</strong>
                  <span>{item.name || "名称待补充"}</span>
                </div>
                <span className={`pf-watch-priority ${meta.className}`}>{meta.label}</span>
                <div className="pf-watch-context">
                  <span>{item.thesis || "尚未设置关注逻辑"}</span>
                  {item.focus.length > 0 && (
                    <div>
                      {item.focus.map((focus) => (
                        <span key={focus}>{focus}</span>
                      ))}
                    </div>
                  )}
                </div>
                {manageOpen && (
                  <div className="pf-watch-actions">
                    <button type="button" onClick={() => beginEdit(item)} aria-label={`编辑 ${item.symbol}`}>
                      编辑
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => remove(item.symbol)}
                      disabled={submitting}
                      aria-label={`移除 ${item.symbol}`}
                    >
                      移除
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
