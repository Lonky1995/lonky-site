"use client";

import { useEffect, useState } from "react";

// 现金余额录入弹窗：手动填当前现金 → POST /api/portfolio/cash → 写入并同步。
// 口令走 body 校验（服务端持真正的 gateway 密钥，浏览器不碰）。

type Props = {
  open: boolean;
  current: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

const inputCls =
  "w-full border-2 border-border bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none";
const labelCls = "block font-mono text-xs uppercase tracking-widest text-muted";

export default function CashModal({ open, current, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount(current != null ? String(current) : "");
      setError(null);
    }
  }, [open, current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 0) {
      setError("请填写有效的现金金额（非负数字）");
      return;
    }
    if (!passcode.trim()) {
      setError("请填写密码");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim(), amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "提交失败");
        setSubmitting(false);
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border-2 border-border bg-background p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 font-mono text-xs uppercase tracking-widest text-accent">设置现金</div>
        <h2 className="mb-5 font-mono text-xl font-bold">现金余额</h2>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>当前现金（美元）</label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例如 12000"
              className={`mt-1 ${inputCls}`}
              autoFocus
            />
            <p className="mt-1.5 font-mono text-[11px] text-muted">
              手动维护：填入账户里未买入持仓的可用现金。总资产 = 持仓市值 + 现金。
            </p>
          </div>

          <div>
            <label className={labelCls}>密码</label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="写入口令"
              className={`mt-1 ${inputCls}`}
            />
          </div>

          {error && <div className="border-2 border-red-500/40 bg-red-500/5 p-3 font-mono text-xs text-red-500">{error}</div>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 border-2 border-accent bg-accent/10 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-accent transition-colors hover:bg-accent/25 disabled:opacity-50"
            >
              {submitting ? "保存中…" : "保存"}
            </button>
            <button
              onClick={onClose}
              disabled={submitting}
              className="border-2 border-border px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-foreground/40"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
