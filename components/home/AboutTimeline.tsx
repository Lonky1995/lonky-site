"use client";
import Image from "next/image";
export function AboutTimeline() {
  return (
    <section className="section about" id="about">
      <div className="section-head reveal" data-reveal="">
        <div>
          <h2>{"一直在做产品。"}</h2>
          <p>
            {"从社交、内容到加密货币。"}
            <br />
            {"现在，用 AI 构建自己想要的工具。"}
          </p>
        </div>
      </div>
      <div className="timeline" data-reveal="">
        <div className="timeline-line"></div>
        <div className="timeline-entry reveal" data-reveal="">
          <span>{"2018"}</span>
          <div className="company-brand company-brand-text">
            <h3>{"Token Galaxy"}</h3>
          </div>
          <p>{"开始创业"}</p>
        </div>
        <div className="timeline-entry reveal" data-reveal="">
          <span>{"2020–23"}</span>
          <div className="company-brand">
            <Image
              unoptimized
              src="/images/logos/wechat.png"
              alt="微信 Logo"
              width={40}
              height={40}
            />
            <h3>{"腾讯微信"}</h3>
          </div>
          <p>{"产品经理"}</p>
        </div>
        <div className="timeline-entry reveal" data-reveal="">
          <span>{"2023"}</span>
          <div className="company-brand">
            <h3>{"Followin"}</h3>
          </div>
          <p>{"联合创办"}</p>
        </div>
        <div className="timeline-entry reveal" data-reveal="">
          <span>{"2024"}</span>
          <div className="company-brand">
            <Image
              unoptimized
              src="/images/logos/bingx.jpeg"
              alt="BingX Logo"
              width={40}
              height={40}
            />
            <h3>{"BingX"}</h3>
          </div>
          <p>{"产品经理"}</p>
        </div>
        <div className="timeline-entry reveal" data-reveal="">
          <span>{"2025"}</span>
          <div className="company-brand">
            <Image
              unoptimized
              src="/images/logos/okx.png"
              alt="OKX Logo"
              width={40}
              height={40}
            />
            <h3>{"OKX"}</h3>
          </div>
          <p>{"产品经理"}</p>
        </div>
      </div>
    </section>
  );
}
