import { ImageResponse } from "next/og";
import { siteConfig } from "@/data/site-config";

export const runtime = "edge";
export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  const domain = siteConfig.url.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0f",
          position: "relative",
        }}
      >
        {/* Subtle gradient background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
          }}
        />
        {/* Logo text */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 24,
          }}
        >
          {siteConfig.name}
        </div>
        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#94a3b8",
            fontWeight: 400,
          }}
        >
          Product Manager & Vibecoder
        </div>
        {/* URL */}
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "#475569",
            marginTop: 32,
          }}
        >
          {domain}
        </div>
      </div>
    ),
    { ...size }
  );
}
