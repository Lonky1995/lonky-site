"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
const CryptoMotion = dynamic(() => import("./motion/CryptoMotion"), {
  ssr: false,
});
export function CryptoEntry() {
  const host = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => setAnimate(visible && !preference.matches);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    preference.addEventListener("change", update);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", update);
    };
  }, []);

  return (
    <section className="section crypto" id="crypto">
      <div className="crypto-copy reveal" data-reveal="">
        <h2>
          {"保持观察。"}
          <br />
          {"独立判断。"}
        </h2>
        <p>
          {"加密市场是我长期关注的领域。"}
          <br />
          {"把观察、信息和工具，放在一个入口。"}
        </p>
        <Link className="pill-dark" href="/crypto">
          {"进入 Crypto ↗"}
        </Link>
      </div>
      <div
        className="crypto-map reveal"
        ref={host}
        role="img"
        aria-label="Crypto 入口示意，连接市场观察、信息摘要与研究工具；不展示行情数据"
        data-reveal=""
      >
        <svg viewBox="0 0 520 380">
          <g
            className="network-paths"
            fill="none"
            stroke="#75816b"
            strokeWidth="1"
          >
            <circle cx="260" cy="190" r="125"></circle>
            <ellipse
              cx="260"
              cy="190"
              rx="210"
              ry="65"
              transform="rotate(-28 260 190)"
            ></ellipse>
            <ellipse
              cx="260"
              cy="190"
              rx="210"
              ry="65"
              transform="rotate(28 260 190)"
            ></ellipse>
            <path d="M90 80L260 190L430 80M90 300L260 190L430 300"></path>
          </g>
          <g fill="#dfe3d8" stroke="#75816b">
            <circle cx="260" cy="190" r="43"></circle>
            <circle cx="90" cy="80" r="7"></circle>
            <circle cx="430" cy="80" r="7"></circle>
            <circle cx="90" cy="300" r="7"></circle>
            <circle cx="430" cy="300" r="7"></circle>
          </g>
          <g
            fill="#293326"
            textAnchor="middle"
            fontFamily="Helvetica Neue, sans-serif"
            fontSize="13"
          >
            <text x="260" y="195">
              {"CRYPTO"}
            </text>
            <text x="90" y="57">
              {"市场观察"}
            </text>
            <text x="430" y="57">
              {"信息摘要"}
            </text>
            <text x="90" y="330">
              {"研究工具"}
            </text>
            <text x="430" y="330">
              {"独立判断"}
            </text>
          </g>
        </svg>
        {animate && (
          <div className="crypto-motion" aria-hidden="true">
            <CryptoMotion />
          </div>
        )}
        <span className="map-caption">{"OBSERVE / CONNECT / THINK"}</span>
      </div>
    </section>
  );
}
