import type { SessionUser } from "@/lib/podcast/auth";

export const LEGACY_DISPLAY_NAME = "Legacy User";
export const DEFAULT_AVATAR_URL = "/images/avatar-default.svg";

export type StoredDiscussion = {
  id: string;
  user_id: string | null;
  display_name_snapshot: string | null;
  avatar_url_snapshot: string | null;
  legacy_visitor_id: string | null;
  question: string;
  answer: string;
  created_at: string;
};

export type DiscussionView = {
  id: string;
  userId: string | null;
  displayName: string;
  avatarUrl: string;
  question: string;
  answer: string;
  createdAt: string;
  isCurrentUser: boolean;
};

type LegacyDiscussion = {
  id?: unknown;
  visitorId?: unknown;
  question?: unknown;
  answer?: unknown;
  createdAt?: unknown;
  user_id?: unknown;
  display_name_snapshot?: unknown;
  avatar_url_snapshot?: unknown;
  legacy_visitor_id?: unknown;
  created_at?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseCreatedAt(value: unknown): string {
  const fromString = asString(value);
  if (!fromString) return new Date().toISOString();
  const timestamp = Date.parse(fromString);
  return Number.isNaN(timestamp) ? new Date().toISOString() : new Date(timestamp).toISOString();
}

export function normalizeStoredDiscussion(raw: unknown): StoredDiscussion | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as LegacyDiscussion;

  const id = asString(input.id) || crypto.randomUUID();
  const question = asString(input.question);
  const answer = asString(input.answer);
  if (!question || !answer) return null;

  const userId = asString(input.user_id);
  const legacyVisitorId = asString(input.legacy_visitor_id) || asString(input.visitorId);

  const displayNameSnapshot =
    asString(input.display_name_snapshot) ||
    (userId ? null : LEGACY_DISPLAY_NAME);
  const avatarSnapshot =
    asString(input.avatar_url_snapshot) ||
    (userId ? null : DEFAULT_AVATAR_URL);
  const createdAt = parseCreatedAt(input.created_at ?? input.createdAt);

  return {
    id,
    user_id: userId,
    display_name_snapshot: displayNameSnapshot,
    avatar_url_snapshot: avatarSnapshot,
    legacy_visitor_id: legacyVisitorId,
    question,
    answer,
    created_at: createdAt,
  };
}

export function normalizeStoredDiscussions(raw: unknown): StoredDiscussion[] {
  if (!Array.isArray(raw)) return [];
  const parsed: StoredDiscussion[] = [];

  for (const item of raw) {
    const normalized = normalizeStoredDiscussion(item);
    if (!normalized) continue;
    parsed.push(normalized);
  }

  parsed.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

  const out: StoredDiscussion[] = [];
  const seenIds = new Set<string>();
  const seenUserIds = new Set<string>();
  for (const item of parsed) {
    if (seenIds.has(item.id)) continue;
    if (item.user_id && seenUserIds.has(item.user_id)) continue;
    seenIds.add(item.id);
    if (item.user_id) seenUserIds.add(item.user_id);
    out.push(item);
  }

  return out;
}

export function createStoredDiscussion(input: {
  question: string;
  answer: string;
  user: SessionUser;
}): StoredDiscussion {
  return {
    id: crypto.randomUUID(),
    user_id: input.user.id,
    display_name_snapshot: input.user.name || "User",
    avatar_url_snapshot: input.user.image || null,
    legacy_visitor_id: null,
    question: input.question.trim(),
    answer: input.answer.trim(),
    created_at: new Date().toISOString(),
  };
}

export function hasPosted(records: StoredDiscussion[], userId: string): boolean {
  return records.some((record) => record.user_id === userId);
}

export function toDiscussionView(
  record: StoredDiscussion,
  currentUser: SessionUser | null
): DiscussionView {
  const isCurrentUser = !!currentUser && record.user_id === currentUser.id;
  const displayName =
    record.display_name_snapshot ||
    (isCurrentUser ? currentUser?.name || "You" : LEGACY_DISPLAY_NAME);
  const avatarUrl =
    record.avatar_url_snapshot ||
    (isCurrentUser ? currentUser?.image : null) ||
    DEFAULT_AVATAR_URL;

  return {
    id: record.id,
    userId: record.user_id,
    displayName,
    avatarUrl,
    question: record.question,
    answer: record.answer,
    createdAt: record.created_at,
    isCurrentUser,
  };
}
