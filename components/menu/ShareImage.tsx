"use client";

import { forwardRef } from "react";
import type { MenuRecord } from "@/lib/menu/storage";

/**
 * 专门用于导出分享图的离屏组件
 * 尺寸：1080 × 1440 (3:4)
 * 使用绝对像素单位，不依赖 Tailwind 响应式
 */
export const ShareImage = forwardRef<HTMLDivElement, { record: MenuRecord }>(
  function ShareImage({ record }, ref) {
    const kaitiFont =
      "'STKaiti','Kaiti SC','KaiTi','BiauKai','DFKai-SB', serif";

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          minHeight: 1440,
          padding: "80px 72px",
          background:
            "radial-gradient(ellipse at center, #F4F0E6 0%, #EFE8DA 60%, #E8DFCB 100%)",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#1A1A1A",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* 标题 */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h1
            style={{
              fontFamily: kaitiFont,
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: "0.05em",
            }}
          >
            陈绚妮家的今日菜谱
          </h1>
          <div
            style={{
              marginTop: 20,
              fontSize: 26,
              color: "rgba(26,26,26,0.55)",
              letterSpacing: "0.08em",
            }}
          >
            {record.dateLabel}
          </div>
          {/* 装饰分割线 */}
          <div
            style={{
              marginTop: 36,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 120,
                height: 2,
                background: "rgba(26,26,26,0.25)",
              }}
            />
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#B8342E",
              }}
            />
            <div
              style={{
                width: 120,
                height: 2,
                background: "rgba(26,26,26,0.25)",
              }}
            />
          </div>
        </div>

        {/* 大人菜谱 */}
        <Section title="大人" subtitle={`${record.adults ?? 4} 人份`}>
          {record.adult.map((m, i) => (
            <Dish
              key={i}
              name={m.name}
              category={m.category}
              ingredients={m.ingredients}
            />
          ))}
        </Section>

        {/* 宝宝菜谱 */}
        {record.baby.length > 0 && (
          <Section
            title="宝宝"
            subtitle={`1 岁半 · ${record.babies ?? 2} 人份`}
            accent
          >
            {record.baby.map((m, i) => (
              <Dish
                key={i}
                name={m.name}
                category={m.category}
                ingredients={m.ingredients}
                accent
              />
            ))}
          </Section>
        )}

        {/* 底部红印章水印 */}
        <div
          style={{
            marginTop: 48,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 8,
              border: "2px solid #B8342E",
              background: "rgba(184,52,46,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#B8342E",
              fontSize: 30,
              fontFamily: "serif",
              fontWeight: 700,
              transform: "rotate(-6deg)",
            }}
          >
            ♥
          </div>
          <div
            style={{
              fontFamily: kaitiFont,
              fontSize: 26,
              color: "rgba(26,26,26,0.55)",
              letterSpacing: "0.15em",
            }}
          >
            lonky.me/menu
          </div>
        </div>
      </div>
    );
  },
);

function Section({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <span
          style={{
            border: accent ? "2px solid #B8342E" : "2px solid #1A1A1A",
            background: accent ? "rgba(184,52,46,0.05)" : "transparent",
            color: accent ? "#B8342E" : "#1A1A1A",
            padding: "6px 16px",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.2em",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 22,
            color: "rgba(26,26,26,0.5)",
          }}
        >
          {subtitle}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function Dish({
  name,
  category,
  ingredients,
  accent,
}: {
  name: string;
  category: string;
  ingredients: string[];
  accent?: boolean;
}) {
  const mainIngredients = ingredients.slice(0, 6).join("、");
  return (
    <div
      style={{
        border: "2px solid #1A1A1A",
        background: "rgba(255,255,255,0.5)",
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 20,
            color: accent ? "#B8342E" : "#1A1A1A",
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {category}
        </div>
      </div>
      <div
        style={{
          fontSize: 20,
          color: "rgba(26,26,26,0.65)",
          lineHeight: 1.5,
        }}
      >
        {mainIngredients}
      </div>
    </div>
  );
}
