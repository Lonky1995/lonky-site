"use client";

import { useEffect, useState } from "react";

// 仓位录入弹窗：结构化交易计划表单 → POST /api/portfolio/add → 写入并同步。
// 口令走 body 校验（服务端持真正的 gateway 密钥，浏览器不碰）。

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type FormState = {
  symbol: string;
  companyName: string;
  direction: "long" | "short";
  size: string;
  entryDate: string; // datetime-local 值
  entryPrice: string;
  logic: string;
  plan: string;
  validate: string;
  invalidate: string;
  stopLoss: string;
  conviction: number;
};

const EMPTY: FormState = {
  symbol: "",
  companyName: "",
  direction: "long",
  size: "",
  entryDate: "",
  entryPrice: "",
  logic: "",
  plan: "",
  validate: "",
  invalidate: "",
  stopLoss: "",
  conviction: 3,
};

// 本地时间 → datetime-local 默认值（yyyy-MM-ddTHH:mm）
function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputCls =
  "w-full border-2 border-border bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none";
const labelCls = "block font-mono text-xs uppercase tracking-widest text-muted";

export default function AddPositionModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validateMsg, setValidateMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // 代码失焦时校验存在性 + 取公司全称
  const validateSymbol = async () => {
    const sym = form.symbol.trim().replace(/^\$/, "").toUpperCase();
    if (!sym) {
      setValidateMsg(null);
      return;
    }
    setValidating(true);
    setValidateMsg(null);
    try {
      const res = await fetch(`/api/portfolio/validate?symbol=${encodeURIComponent(sym)}`);
      const data = (await res.json()) as { ok: boolean; symbol?: string; name?: string; error?: string };
      if (data.ok && data.name) {
        // 回填标准化代码 + 公司全称
        setForm((f) => ({ ...f, symbol: data.symbol || sym, companyName: data.name || "" }));
        setValidateMsg({ ok: true, text: `✓ ${data.symbol} · ${data.name}` });
      } else {
        setForm((f) => ({ ...f, companyName: "" }));
        setValidateMsg({ ok: false, text: `⚠ ${data.error || "未找到该代码"}（仍可提交）` });
      }
    } catch {
      setValidateMsg({ ok: false, text: "校验失败（仍可提交）" });
    } finally {
      setValidating(false);
    }
  };

  // 打开时重置 + 默认开仓时间为当前，口令记住上次输入
  useEffect(() => {
    if (!open) return;
    // 延后一拍避免在 effect 内同步 setState 触发级联渲染告警
    queueMicrotask(() => {
      setForm({ ...EMPTY, entryDate: nowLocalInput() });
      setError(null);
      setDone(false);
      setValidateMsg(null);
      setPasscode(sessionStorage.getItem("pf_passcode") || "");
    });
  }, [open]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    // 前端必填校验
    const need: [keyof FormState, string][] = [
      ["symbol", "标的"],
      ["size", "仓位大小"],
      ["logic", "开仓逻辑"],
      ["validate", "验证信号"],
      ["invalidate", "证伪信号"],
    ];
    for (const [k, label] of need) {
      if (!String(form[k]).trim()) {
        setError(`请填写：${label}`);
        return;
      }
    }
    if (!passcode.trim()) {
      setError("请填写密码");
      return;
    }

    setSubmitting(true);
    try {
      const entryTime = form.entryDate ? new Date(form.entryDate).getTime() : undefined;
      const res = await fetch("/api/portfolio/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: passcode.trim(),
          symbol: form.symbol.trim().replace(/^\$/, "").toUpperCase(),
          companyName: form.companyName.trim() || undefined,
          direction: form.direction,
          size: form.size.trim(),
          entryTime,
          entryPrice: form.entryPrice.trim() || undefined,
          logic: form.logic.trim(),
          plan: form.plan.trim() || undefined,
          validate: form.validate.trim(),
          invalidate: form.invalidate.trim(),
          stopLoss: form.stopLoss.trim() || undefined,
          conviction: form.conviction,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || `提交失败（${res.status}）`);
        setSubmitting(false);
        return;
      }
      sessionStorage.setItem("pf_passcode", passcode.trim());
      setSubmitting(false);
      setDone(true);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col border-2 border-border bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏（固定） */}
        <div className="flex shrink-0 items-center justify-between border-b-2 border-border px-5 py-4">
          <span className="font-mono text-xs uppercase tracking-widest text-accent">记录持仓 · 交易计划</span>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-accent"
          >
            ✕ 关闭
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
          {/* 标的 + 方向 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>标的 *{validating && <span className="ml-2 normal-case text-muted">校验中…</span>}</label>
              <input
                className={`${inputCls} mt-1.5 uppercase`}
                placeholder="VELO / NVDA / BTC"
                value={form.symbol}
                onChange={(e) => set("symbol", e.target.value)}
                onBlur={validateSymbol}
              />
              {validateMsg && (
                <div className={`mt-1 font-mono text-[11px] ${validateMsg.ok ? "text-emerald-500" : "text-amber-500"}`}>
                  {validateMsg.text}
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>方向 *</label>
              <div className="mt-1.5 flex border-2 border-border">
                {(["long", "short"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => set("direction", d)}
                    className={`flex-1 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                      form.direction === d
                        ? d === "long"
                          ? "bg-emerald-600/80 text-white"
                          : "bg-red-600/80 text-white"
                        : "text-muted hover:text-accent"
                    }`}
                  >
                    {d === "long" ? "多 Long" : "空 Short"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 仓位大小 + 入场价 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>数量（股/币）*</label>
              <input
                className={`${inputCls} mt-1.5`}
                placeholder="240 / 0.5 / 30"
                value={form.size}
                onChange={(e) => set("size", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>入场价</label>
              <input
                className={`${inputCls} mt-1.5`}
                placeholder="94200"
                value={form.entryPrice}
                onChange={(e) => set("entryPrice", e.target.value)}
              />
            </div>
          </div>

          {/* 开仓时间 + 止损 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>开仓时间</label>
              <input
                type="datetime-local"
                className={`${inputCls} mt-1.5`}
                value={form.entryDate}
                onChange={(e) => set("entryDate", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>止损位</label>
              <input
                className={`${inputCls} mt-1.5`}
                placeholder="91500"
                value={form.stopLoss}
                onChange={(e) => set("stopLoss", e.target.value)}
              />
            </div>
          </div>

          {/* 开仓逻辑 */}
          <div>
            <label className={labelCls}>开仓逻辑（thesis）*</label>
            <textarea
              className={`${inputCls} mt-1.5 min-h-[70px] resize-y`}
              placeholder="为什么开这个仓？核心判断是什么"
              value={form.logic}
              onChange={(e) => set("logic", e.target.value)}
            />
          </div>

          {/* 交易计划 */}
          <div>
            <label className={labelCls}>交易计划（目标 / 加仓 / 周期）</label>
            <textarea
              className={`${inputCls} mt-1.5 min-h-[60px] resize-y`}
              placeholder="目标价、分批止盈、回踩加仓、预期持有周期"
              value={form.plan}
              onChange={(e) => set("plan", e.target.value)}
            />
          </div>

          {/* 验证 + 证伪 */}
          <div>
            <label className={labelCls}>✅ 验证信号（什么发生 = 我对了）*</label>
            <textarea
              className={`${inputCls} mt-1.5 min-h-[60px] resize-y`}
              placeholder="出现什么信号说明判断成立、该持有/加仓"
              value={form.validate}
              onChange={(e) => set("validate", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>❌ 证伪信号（什么发生 = 我错了）*</label>
            <textarea
              className={`${inputCls} mt-1.5 min-h-[60px] resize-y`}
              placeholder="出现什么信号说明判断错了、该止损/离场"
              value={form.invalidate}
              onChange={(e) => set("invalidate", e.target.value)}
            />
          </div>

          {/* 信念度 */}
          <div>
            <label className={labelCls}>信念度：{form.conviction} / 5</label>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => set("conviction", n)}
                  className={`h-8 flex-1 border-2 font-mono text-xs transition-colors ${
                    form.conviction >= n ? "border-accent bg-accent/20 text-accent" : "border-border text-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* 口令 */}
          <div className="border-t-2 border-border pt-4">
            <label className={labelCls}>密码 *</label>
            <input
              type="password"
              className={`${inputCls} mt-1.5`}
              placeholder="录入密码"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </div>

          {error && (
            <div className="border-2 border-red-500/50 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-400">
              {error}
            </div>
          )}
          {done && (
            <div className="border-2 border-emerald-500/50 bg-emerald-500/10 px-3 py-2.5 font-mono text-xs text-emerald-400">
              ✅ 已记录！仓位已写入。网站数据经部署刷新，约 1-3 分钟后在看板显示。
            </div>
          )}
        </div>

        {/* 底部操作（固定，永远可见） */}
        <div className="flex shrink-0 justify-end gap-3 border-t-2 border-border bg-background px-5 py-4">
          {done ? (
            <button
              onClick={onClose}
              className="border-2 border-accent bg-accent/20 px-5 py-2 font-mono text-xs uppercase tracking-widest text-accent hover:bg-accent/30"
            >
              完成
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={submitting}
                className="border-2 border-border px-5 py-2 font-mono text-xs uppercase tracking-widest text-muted hover:text-accent disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="border-2 border-accent bg-accent/20 px-5 py-2 font-mono text-xs uppercase tracking-widest text-accent hover:bg-accent/30 disabled:opacity-50"
              >
                {submitting ? "提交中…" : "记录持仓"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
