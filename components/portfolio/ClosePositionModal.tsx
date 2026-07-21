"use client";

import { useEffect, useState } from "react";

// 平仓确认弹窗：输密码确认 → POST /api/portfolio/close → 软删除（status→closed）并同步。
// 口令走 body 校验（服务端持真正的 gateway 密钥，浏览器不碰）。

type Props = {
  open: boolean;
  symbol: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

const inputCls =
  "w-full border-2 border-border bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none";
const labelCls = "block font-mono text-xs uppercase tracking-widest text-muted";

export default function ClosePositionModal({ open, symbol, onClose, onSuccess }: Props) {
  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPasscode("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !symbol) return null;

  const submit = async () => {
    if (!passcode.trim()) {
      setError("请填写密码");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim(), symbol }),
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
        <div className="mb-1 font-mono text-xs uppercase tracking-widest text-[var(--loss)]">平仓</div>
        <h2 className="mb-2 font-mono text-xl font-bold">
          平掉 <span className="text-[var(--loss)]">{symbol}</span> 持仓？
        </h2>
        <p className="mb-5 font-mono text-[11px] text-muted">
          平仓为软删除：该持仓将标记为已平仓，不再出现在持仓列表，历史记录保留。
        </p>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>密码</label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="写入口令"
              className={`mt-1 ${inputCls}`}
              autoFocus
            />
          </div>

          {error && <div className="border-2 border-red-500/40 bg-red-500/5 p-3 font-mono text-xs text-red-500">{error}</div>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 border-2 border-[var(--loss)] bg-[var(--loss)]/10 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-[var(--loss)] transition-colors hover:bg-[var(--loss)]/25 disabled:opacity-50"
            >
              {submitting ? "平仓中…" : "确认平仓"}
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
