"use client";
import { useState } from "react";
export function ContactCTA() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  async function copyWechat() {
    try {
      await navigator.clipboard.writeText("Lonkyday");
      setCopied(true);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }
  return (
    <section className="section contact" id="contact">
      <div className="reveal" data-reveal="">
        <h2>{"最近，你在做什么？"}</h2>
        <p>{"一个想法、一个问题，或一个有趣的新发现。都可以聊聊。"}</p>
        <div className="contact-links">
          <a href="https://twitter.com/ImLonky" target="_blank" rel="noopener">
            {"X ↗"}
          </a>
          <a href="https://github.com/Lonky1995" target="_blank" rel="noopener">
            {"GitHub ↗"}
          </a>
          <button id="copy-bottom" onClick={copyWechat}>
            {copied ? "已复制微信号 ✓" : "微信：Lonkyday ⧉"}
          </button>
        </div>
      </div>
      <span className="contact-star reveal" aria-hidden="true" data-reveal="">
        {"✳︎"}
      </span>
      <span role="status">
        {failed ? "请手动复制微信号：Lonkyday" : copied ? "微信号已复制" : ""}
      </span>
    </section>
  );
}
