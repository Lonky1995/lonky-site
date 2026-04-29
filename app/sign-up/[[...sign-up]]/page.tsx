import Link from "next/link";
import { ClerkProvider, SignUp } from "@clerk/nextjs";

type SignUpPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function asSingle(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const params = await searchParams;
  const redirectUrl = asSingle(params.redirect_url);

  if (!hasClerk) {
    const fallbackBase = process.env.NEXT_PUBLIC_TRADEMIRROR_URL || "https://trademirror.lonky.me";
    const fallback = new URL("/sign-up", fallbackBase);
    if (redirectUrl) fallback.searchParams.set("redirect_url", redirectUrl);

    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">注册暂未就绪</h1>
        <p className="mt-3 text-sm text-muted">
          当前站点未配置本地注册，请前往 TradeMirror 完成注册后返回。
        </p>
        <Link
          href={fallback.toString()}
          className="mt-6 inline-block rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          前往 TradeMirror 注册
        </Link>
      </div>
    );
  }

  return (
    <ClerkProvider>
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center justify-center px-4 py-10">
        <SignUp fallbackRedirectUrl={redirectUrl || "/podcast-notes"} signInUrl="/sign-in" />
      </div>
    </ClerkProvider>
  );
}
