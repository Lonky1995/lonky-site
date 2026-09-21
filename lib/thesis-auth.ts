import { createHmac, timingSafeEqual } from "node:crypto";

export function validSyncSignature(raw: string, timestamp: string | null, signature: string | null): boolean {
  const secret = process.env.THESIS_SYNC_SECRET;
  if (!secret || !timestamp || !signature || !/^\d{13}$/.test(timestamp)) return false;
  if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60_000) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  try { return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex")); } catch { return false; }
}
