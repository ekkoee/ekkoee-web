"use client";

/**
 * FloatingAgent
 *
 * 右下角常駐的脈動綠點。點下去展開 HERMES 風格終端,
 * 可以跟 ekkoee agent 即時對話,token 會逐字 streaming 進來。
 *
 * 掛在 app/layout.tsx 的 <body> 最後面即可。
 * 會自動隱藏於 /portal、/admin、/login、/auth 路徑。
 */

import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { usePathname } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_QUESTIONS = [
  "你們和傳統 ERP 差在哪?",
  "我的工廠資料安全嗎?",
  "怎麼開始 AI 企業健檢?",
];

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "▸ agent 已就緒。我是 ekkoee 的首頁 agent,你可以問我任何關於工廠 AI 化的事。",
};

// 這些路徑底下不顯示浮動 agent(客戶入口、管理後台、登入頁)
const HIDE_ON_PATHS = ["/portal", "/admin", "/login", "/auth"];

export default function FloatingAgent() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const shouldHide = HIDE_ON_PATHS.some((p) => pathname?.startsWith(p));

  // ESC 關閉
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // 新訊息進來自動滾到底
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // 打開時 focus 輸入框
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  // 關閉時中斷進行中的 request
  useEffect(() => {
    if (!open && abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, [open]);

  async function sendMessage(text: string) {
    const userMsg: Message = { role: "user", content: text };

    // 先 optimistic 塞入 user message + 空白的 assistant placeholder
    const afterUser = [...messages, userMsg];
    setMessages([...afterUser, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 只傳真實對話(不傳初始歡迎訊息),減少 token
          messages: afterUser
            .filter((m, i) => !(i === 0 && m === INITIAL_MESSAGE))
            .map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: accumulated,
          };
          return updated;
        });
      }

      // 如果整段 stream 什麼都沒收到,留個錯誤訊息
      if (!accumulated) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "▸ agent 回應為空。可能是 provider rate limit,請稍後再試。",
          };
          return updated;
        });
      }
    } catch (err) {
      // 如果是使用者手動中斷就不顯示錯誤
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content:
            "▸ 連線失敗。可能是 API key 還沒設定,或免費 tier 達到 rate limit。創辦人會看到這個錯誤並處理。",
        };
        return updated;
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    sendMessage(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter 送出,Shift+Enter 換行
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = input.trim();
      if (text && !loading) sendMessage(text);
    }
  }

  if (shouldHide) return null;

  return (
    <>
      {/* 收起狀態:脈動綠點按鈕 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-[#00FF88]/30 bg-[#0A0A0C]/90 px-4 py-3 font-mono text-xs text-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.15)] backdrop-blur transition-all hover:border-[#00FF88] hover:shadow-[0_0_30px_rgba(0,255,136,0.35)]"
          aria-label="開啟 ekkoee agent"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00FF88] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00FF88]" />
          </span>
          <span className="opacity-80">agent · online</span>
        </button>
      )}

      {/* 展開狀態:終端視窗 */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex h-[560px] max-h-[80vh] w-[92vw] max-w-[420px] flex-col overflow-hidden rounded-lg border border-[#00FF88]/40 bg-[#0A0A0C]/95 font-mono shadow-[0_0_40px_rgba(0,255,136,0.2)] backdrop-blur"
          role="dialog"
          aria-label="ekkoee agent"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#00FF88]/20 bg-[#00FF88]/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00FF88] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00FF88]" />
              </span>
              <span className="text-xs tracking-wider text-[#00FF88]">
                ◉ EKKOEE.AGENT
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-[#00FF88]/60 transition-colors hover:text-[#00FF88]"
              aria-label="關閉"
            >
              [ESC] ✕
            </button>
          </div>

          {/* 訊息區 */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={msg.role === "user" ? "text-right" : ""}
              >
                {msg.role === "user" ? (
                  <div className="inline-block max-w-[85%] rounded border border-[#FFB938]/30 bg-[#FFB938]/10 px-3 py-2 text-left text-xs text-[#FFB938]">
                    {msg.content}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-xs leading-relaxed text-[#E6E2D3]">
                    {msg.content}
                    {loading && i === messages.length - 1 && (
                      <span className="ml-1 inline-block h-[12px] w-[6px] animate-pulse bg-[#00FF88] align-middle" />
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* 初始狀態:顯示建議問題 */}
            {messages.length === 1 && !loading && (
              <div className="space-y-1.5 pt-2">
                <div className="text-[10px] tracking-wider text-[#A29C87]">
                  ▸ 試試看問:
                </div>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="block w-full rounded border border-[#00FF88]/20 px-2.5 py-1.5 text-left text-xs text-[#00FF88]/70 transition-colors hover:border-[#00FF88]/50 hover:text-[#00FF88]"
                  >
                    → {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 輸入區 */}
          <form
            onSubmit={onSubmit}
            className="border-t border-[#00FF88]/20 bg-[#00FF88]/5 p-3"
          >
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="問我任何事..."
                disabled={loading}
                rows={1}
                className="flex-1 resize-none rounded border border-[#00FF88]/30 bg-transparent px-2.5 py-1.5 text-xs text-[#E6E2D3] placeholder-[#A29C87]/50 outline-none transition-colors focus:border-[#00FF88] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded border border-[#00FF88]/50 bg-[#00FF88]/10 px-3 text-xs text-[#00FF88] transition hover:bg-[#00FF88]/20 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="送出"
              >
                ↵
              </button>
            </div>
            <div className="mt-1.5 text-[9px] tracking-wider text-[#A29C87]/60">
              Enter 送出 · Shift+Enter 換行 · ESC 關閉
            </div>
          </form>
        </div>
      )}
    </>
  );
}
