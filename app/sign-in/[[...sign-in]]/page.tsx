import Link from "next/link";
import { ClerkProvider, SignIn } from "@clerk/nextjs";

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function asSingle(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const params = await searchParams;
  const redirectUrl = asSingle(params.redirect_url);

  if (!hasClerk) {
    const fallbackBase = process.env.NEXT_PUBLIC_TRADEMIRROR_URL || "https://trademirror.lonky.me";
    const fallback = new URL("/sign-in", fallbackBase);
    if (redirectUrl) fallback.searchParams.set("redirect_url", redirectUrl);

    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">登录暂未就绪</h1>
        <p className="mt-3 text-sm text-muted">
          当前站点未配置本地登录，请前往 TradeMirror 完成登录后返回。
        </p>
        <Link
          href={fallback.toString()}
          className="mt-6 inline-block rounded-none bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          前往 TradeMirror 登录
        </Link>
      </div>
    );
  }

  return (
    <ClerkProvider>
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center justify-center px-4 py-10">
        <SignIn fallbackRedirectUrl={redirectUrl || "/podcast-notes"} signUpUrl="/sign-up" />
      </div>
    </ClerkProvider>
  );
}
