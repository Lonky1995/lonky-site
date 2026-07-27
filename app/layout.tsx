import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import {
  Instrument_Sans,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import localFont from "next/font/local";
import { LocaleProvider } from "@/components/locale-provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RevealProvider } from "@/components/reveal-provider";
import { siteConfig } from "@/data/site-config";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const notoSerifSC = localFont({
  variable: "--font-noto-serif-sc",
  src: [
    { path: "../public/fonts/noto-serif-sc-400.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/noto-serif-sc-500.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/noto-serif-sc-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
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
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const cookieStore = await cookies();
  const locale =
    (cookieStore.get("locale")?.value as Locale) || defaultLocale;
  const dict = getDictionary(locale);
  const html = (
    <html lang={locale}>
      <head>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="529eee6a-da34-4998-813f-49d5b06b2cec"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${instrumentSans.variable} ${plusJakartaSans.variable} ${notoSerifSC.variable} ${jetbrainsMono.variable} min-h-[100dvh] bg-background font-sans text-foreground antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteConfig.name,
              url: siteConfig.url,
              description: siteConfig.description,
              author: {
                "@type": "Person",
                name: "Lonky",
                url: siteConfig.url,
                jobTitle: "Product Manager & Vibecoder",
                sameAs: [siteConfig.socials.github, siteConfig.socials.twitter],
              },
            }),
          }}
        />
        <LocaleProvider locale={locale} dict={dict}>
          <RevealProvider>
            <Navbar />
            <main className="relative z-10">{children}</main>
            <Footer />
          </RevealProvider>
        </LocaleProvider>
      </body>
    </html>
  );

  if (hasClerk) {
    const { ClerkProvider } = await import("@clerk/nextjs");
    return <ClerkProvider>{html}</ClerkProvider>;
  }

  return html;
}
