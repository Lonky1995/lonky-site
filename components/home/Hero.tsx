"use client";
import Link from "next/link";
import type { CSSProperties } from "react";
import { RobotBackdrop } from "./RobotBackdrop";
export function Hero() {
  return (
    <section className="hero" id="hero" aria-label="Lonky 个人介绍">
      <RobotBackdrop />
      <nav className="nav" aria-label="主导航">
        <Link className="logo animated-name" href="/" aria-label="Lonky">
          <span className="name-letters" aria-hidden="true">
            <span
              className="name-letter"
              style={{ "--letter": "0" } as CSSProperties}
            >
              {"L"}
            </span>
            <span
              className="name-letter"
              style={{ "--letter": "1" } as CSSProperties}
            >
              {"o"}
            </span>
            <span
              className="name-letter"
              style={{ "--letter": "2" } as CSSProperties}
            >
              {"n"}
            </span>
            <span
              className="name-letter"
              style={{ "--letter": "3" } as CSSProperties}
            >
              {"k"}
            </span>
            <span
              className="name-letter"
              style={{ "--letter": "4" } as CSSProperties}
            >
              {"y"}
            </span>
          </span>
        </Link>
        <p className="nav-motto">{"不要让明天的雨淋湿今天的自己"}</p>
      </nav>
      <div className="copy">
        <p className="intro">{"LONKY / PRODUCT MANAGER & AI BUILDER"}</p>
        <h1
          className="reading-title refined-title"
          aria-label="你好，我是 Lonky。"
        >
          <span className="title-mask" aria-hidden="true">
            <span
              className="title-character"
              style={{ "--char": "0" } as CSSProperties}
            >
              {"你"}
            </span>
          </span>
          <span className="title-mask" aria-hidden="true">
            <span
              className="title-character"
              style={{ "--char": "1" } as CSSProperties}
            >
              {"好"}
            </span>
          </span>
          <span className="title-mask" aria-hidden="true">
            <span
              className="title-character"
              style={{ "--char": "2" } as CSSProperties}
            >
              {"，"}
            </span>
          </span>
          <span className="title-mask" aria-hidden="true">
            <span
              className="title-character"
              style={{ "--char": "3" } as CSSProperties}
            >
              {"我"}
            </span>
          </span>
          <span className="title-mask" aria-hidden="true">
            <span
              className="title-character"
              style={{ "--char": "4" } as CSSProperties}
            >
              {"是"}
            </span>
          </span>
          <span className="title-mask" aria-hidden="true">
            <span
              className="title-character"
              style={{ "--char": "5" } as CSSProperties}
            >
              {"\u00a0"}
            </span>
          </span>
          <span className="title-mask" aria-hidden="true">
            <span
              className="title-character"
              style={{ "--char": "6" } as CSSProperties}
            >
              {"L"}
            </span>
          </span>
          <span className="title-mask" aria-hidden="true">
            <span
              className="title-character"
              style={{ "--char": "7" } as CSSProperties}
            >
              {"o"}
            </span>
          </span>
          <span className="title-mask" aria-hidden="true">
            <span
              className="title-character"
              style={{ "--char": "8" } as CSSProperties}
            >
              {"n"}
            </span>
          </span>
          <span className="title-mask" aria-hidden="true">
            <span
              className="title-character"
              style={{ "--char": "9" } as CSSProperties}
            >
              {"k"}
            </span>
          </span>
          <span className="title-mask" aria-hidden="true">
            <span
              className="title-character"
              style={{ "--char": "10" } as CSSProperties}
            >
              {"y"}
            </span>
          </span>
          <span className="title-mask" aria-hidden="true">
            <span
              className="title-character"
              style={{ "--char": "11" } as CSSProperties}
            >
              {"。"}
            </span>
          </span>
        </h1>
        <div className="identity-tags" aria-label="个人身份">
          <span className="identity-tag identity-product">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <rect x="3" y="3" width="14" height="14" rx="3"></rect>
              <path d="M3 8h14M8 8v9"></path>
            </svg>
            <span>{"古典产品经理"}</span>
          </span>
          <span className="identity-tag">
            <svg viewBox="0 0 24 20" aria-hidden="true">
              <circle cx="7" cy="6" r="3"></circle>
              <circle cx="17" cy="6" r="3"></circle>
              <path d="M2 17v-2a5 5 0 0 1 10 0v2M12 17v-2a5 5 0 0 1 10 0v2"></path>
            </svg>
            <span>{"双胞胎奶爸"}</span>
          </span>
          <span className="identity-tag">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m6 5-4 5 4 5m8-10 4 5-4 5M12 3 8 17"></path>
            </svg>
            <span>{"Vibecoder"}</span>
          </span>
        </div>
      </div>
      <a className="stamp" href="#work">
        {"向下探索作品 ↓"}
      </a>
    </section>
  );
}
