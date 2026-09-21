import { createHmac, timingSafeEqual } from "node:crypto";

export function isThesisOwner(user: { id: string; email: string | null }): boolean {
  const ownerId = process.env.THESIS_OWNER_USER_ID;
  if (ownerId && user.id && ownerId === user.id) return true;
  const ownerEmail = process.env.THESIS_OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(ownerEmail && user.email && ownerEmail === user.email.trim().toLowerCase());
}

export function validSyncSignature(raw: string, timestamp: string | null, signature: string | null): boolean {
  const secret = process.env.THESIS_SYNC_SECRET;
  if (!secret || !timestamp || !signature || !/^\d{13}$/.test(timestamp)) return false;
  if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60_000) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  try { return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex")); } catch { return false; }
}
