import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { StarField } from "@/components/ui/StarField";
import { LocaleProvider } from "@/components/locale-provider";
import { siteConfig } from "@/data/site-config";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale =
    (cookieStore.get("locale")?.value as Locale) || defaultLocale;
  const dict = getDictionary(locale);

  return (
    <html lang={locale} className="dark">
      <head>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="529eee6a-da34-4998-813f-49d5b06b2cec"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <LocaleProvider locale={locale} dict={dict}>
          <div className="nebula-bg" aria-hidden="true" />
          <StarField />
          <Navbar />
          <main className="relative z-10 pt-16">{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
