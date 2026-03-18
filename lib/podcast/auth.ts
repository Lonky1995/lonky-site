import type { NextRequest } from "next/server";

export type SessionUser = {
  id: string;
  name: string;
  image: string | null;
};

type Session = {
  user: SessionUser;
};

function isClerkConfigured(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

function pickFirst(values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return null;
}

function tryParseJsonHeader(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    // ignore invalid header payload
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function resolveClerkSession(): Promise<Session | null> {
  try {
    const { auth: clerkAuth, currentUser } = await import("@clerk/nextjs/server");
    const { userId } = await clerkAuth();
    if (!userId) return null;

    const user = await currentUser().catch(() => null);
    const fullName =
      [user?.firstName, user?.lastName]
        .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
        .join(" ")
        .trim() || null;

    const name =
      pickFirst([asString(user?.fullName), fullName, asString(user?.username)]) || "User";
    const image = pickFirst([asString(user?.imageUrl)]);

    return {
      user: {
        id: userId,
        name,
        image,
      },
    };
  } catch {
    return null;
  }
}

export async function auth(req: NextRequest): Promise<Session | null> {
  if (isClerkConfigured()) {
    const clerkSession = await resolveClerkSession();
    if (clerkSession?.user) return clerkSession;
  }

  const userHeader = tryParseJsonHeader(req.headers.get("x-user"));

  const id = pickFirst([
    req.headers.get("x-user-id"),
    asString(userHeader?.id),
    req.cookies.get("user_id")?.value,
  ]);
  if (!id) return null;

  const name =
    pickFirst([
      req.headers.get("x-user-name"),
      asString(userHeader?.name),
      req.cookies.get("user_name")?.value,
    ]) || "User";

  const image = pickFirst([
    req.headers.get("x-user-avatar"),
    req.headers.get("x-user-image"),
    asString(userHeader?.image),
    req.cookies.get("user_avatar")?.value,
  ]);

  return {
    user: {
      id,
      name,
      image,
    },
  };
}
