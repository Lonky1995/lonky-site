"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { renderMarkdown } from "@/lib/podcast/render-markdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatPanelProps = {
  transcript: string;
  meta: { title: string; description?: string };
  systemPrompt: string;
  secret: string;
  skipInitialSummary?: boolean;
  onMessagesChange?: (messages: Message[]) => void;
};

export function ChatPanel({
  transcript,
  meta,
  systemPrompt,
  secret,
  skipInitialSummary = false,
  onMessagesChange,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Track if user has manually scrolled up
  const userScrolledUp = useRef(false);

  // Esc to abort streaming
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
        setIsLoading(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    // Only auto-scroll if user hasn't scrolled up
    if (!userScrolledUp.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (userContent: string, allMessages: Message[]) => {
      setIsLoading(true);

      const newMessages = [
        ...allMessages,
        { id: crypto.randomUUID(), role: "user" as const, content: userContent },
      ];
      setMessages(newMessages);

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        abortRef.current = new AbortController();

        const apiMessages = newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/podcast/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify({ messages: apiMessages, system: systemPrompt }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: fullContent } : m
            )
          );
        }

      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `Error: ${(e as Error).message}` }
                : m
            )
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [secret, systemPrompt]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    sendMessage(text, messages);
  };

  const displayMessages = messages;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="max-h-[500px] overflow-y-auto p-4 space-y-4"
        onScroll={() => {
          const el = scrollContainerRef.current;
          if (!el) return;
          // If user is within 50px of bottom, re-enable auto-scroll
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
          userScrolledUp.current = !atBottom;
        }}
      >
        {displayMessages.length === 0 && isLoading && (
          <div className="text-sm text-muted animate-pulse">
            AI 正在生成笔记...
          </div>
        )}
        {displayMessages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions — show when no user messages yet in the discussion */}
      {!isLoading && !displayMessages.some((m) => m.role === "user") && (
        <div className="flex flex-wrap gap-2 border-t border-border px-4 pt-3">
          {[
            "哪个观点你觉得最有争议？",
            "展开讲讲最核心的那个点",
            "有没有反面案例？",
            "这对我有什么实际启发？",
          ].map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q, messages)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-border p-4"
      >
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Auto-resize
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 72) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.altKey)) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="继续讨论这期播客..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          style={{ maxHeight: 72 }}
          disabled={isLoading}
        />
        <div className="flex flex-col items-center gap-0.5">
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            发送
          </button>
          <span className="text-[10px] text-muted">⌘/Alt+Enter</span>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const html = useMemo(
    () => (message.role === "assistant" && message.content ? renderMarkdown(message.content) : ""),
    [message.role, message.content]
  );

  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`text-sm ${isUser ? "max-w-[80%]" : "max-w-full w-full"}`}>
        <div className={`mb-1 text-xs font-medium text-muted ${isUser ? "text-right" : ""}`}>
          {isUser ? "You" : "AI"}
        </div>
        {isUser ? (
          <div className="select-text cursor-text rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-white whitespace-pre-wrap">
            {message.content}
          </div>
        ) : message.content ? (
          <div
            className="select-text cursor-text rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 prose-custom prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
            <span className="animate-pulse text-muted">...</span>
          </div>
        )}
      </div>
    </div>
  );
}
