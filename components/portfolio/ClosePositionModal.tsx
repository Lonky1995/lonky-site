"use client";

import { useEffect, useMemo, useState } from "react";

// 平仓确认弹窗：输密码 + 平仓数量/价格（选填）→ POST /api/portfolio/close。
// 数量留空或 ≥ 持仓量 = 全平（软删除）；数量 < 持仓量 = 部分平仓，剩余仓位继续持有。
// 口令走 body 校验（服务端持真正的 gateway 密钥，浏览器不碰）。

type Props = {
  open: boolean;
  symbol: string | null;
  size?: string | null; // 当前持仓数量（用于校验/剩余提示）
  onClose: () => void;
  onSuccess: () => void;
};

const inputCls =
  "w-full border-2 border-border bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none";
const labelCls = "block font-mono text-xs uppercase tracking-widest text-muted";

// 从持仓量字符串解析数字（如 "240股" → 240）
function parseQty(s?: string | null): number | null {
  if (!s) return null;
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export default function ClosePositionModal({ open, symbol, size, onClose, onSuccess }: Props) {
  const [passcode, setPasscode] = useState("");
  const [closeQty, setCloseQty] = useState("");
  const [closePrice, setClosePrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalQty = useMemo(() => parseQty(size), [size]);
  const reqQty = useMemo(() => parseQty(closeQty), [closeQty]);

  // 平仓模式：留空 or ≥ 总量 → 全平；否则部分平仓
  const isPartial = reqQty !== null && totalQty !== null && reqQty > 0 && reqQty < totalQty;
  const remaining = isPartial && totalQty !== null && reqQty !== null ? totalQty - reqQty : 0;
  const overQty = reqQty !== null && totalQty !== null && reqQty > totalQty;

  useEffect(() => {
    if (open) {
      setPasscode("");
      setCloseQty("");
      setClosePrice("");
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
    if (overQty) {
      setError(`平仓数量不能超过持仓量 ${totalQty}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: passcode.trim(),
          symbol,
          closeQty: closeQty.trim() || undefined,
          closePrice: closePrice.trim() || undefined,
        }),
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
          {totalQty !== null ? (
            <>当前持仓 {size}。数量留空或填满 = 全平；填小于持仓量 = 部分平仓，剩余仓位继续持有。</>
          ) : (
            <>平仓为软删除：标记为已平仓，不再出现在持仓列表，历史记录保留。</>
          )}
        </p>

        <div className="space-y-4">
          {/* 平仓数量 / 价格 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>平仓数量</label>
              <input
                type="text"
                inputMode="decimal"
                value={closeQty}
                onChange={(e) => setCloseQty(e.target.value)}
                placeholder={totalQty !== null ? `全平 ${totalQty}` : "全平"}
                className={`mt-1 ${inputCls}`}
              />
            </div>
            <div>
              <label className={labelCls}>平仓价格</label>
              <input
                type="text"
                inputMode="decimal"
                value={closePrice}
                onChange={(e) => setClosePrice(e.target.value)}
                placeholder="选填，仅记录"
                className={`mt-1 ${inputCls}`}
              />
            </div>
          </div>

          {/* 实时提示：部分平仓剩余量 / 超额告警 */}
          {overQty ? (
            <div className="border-2 border-amber-500/40 bg-amber-500/5 p-2.5 font-mono text-[11px] text-amber-500">
              平仓数量超过持仓量 {totalQty}，请调整。
            </div>
          ) : isPartial ? (
            <div className="border-2 border-accent/30 bg-accent/[0.04] p-2.5 font-mono text-[11px] text-accent">
              部分平仓：平掉 {reqQty}，剩余 {remaining} 继续持有。
            </div>
          ) : null}

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
              disabled={submitting || overQty}
              className="flex-1 border-2 border-[var(--loss)] bg-[var(--loss)]/10 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-[var(--loss)] transition-colors hover:bg-[var(--loss)]/25 disabled:opacity-50"
            >
              {submitting ? "平仓中…" : isPartial ? "确认部分平仓" : "确认平仓"}
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
