/**
 * POST /api/agent
 *
 * 收前端送來的對話歷史,轉發給選定的 provider(OpenAI 相容),
 * 把 upstream 的 SSE chunk 解開,輸出純文字 token stream 給前端。
 *
 * 為什麼不用 Vercel AI SDK:
 *   - 少一個依賴、少一組 API 版本要追
 *   - OpenAI-compatible SSE 格式三家都一樣,自己解超簡單
 *   - 前端用 response.body.getReader() 讀純文字即可
 *
 * 為什麼用 nodejs runtime 不用 edge:
 *   - Ollama 本地是 http(非 https),Edge runtime fetch 對 http 有限制
 *   - Node runtime 對所有 provider 都穩
 */

import { getActiveProvider } from "@/lib/ai/providers";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 30; // Vercel 預設 10s,拉到 30s 保險

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: ChatMessage[] };
    const messages = body.messages ?? [];

    // 基本防禦:限制訊息數和長度,避免濫用
    if (messages.length > 20) {
      return json({ error: "too many messages" }, 400);
    }
    for (const m of messages) {
      if (typeof m.content !== "string" || m.content.length > 2000) {
        return json({ error: "message too long" }, 400);
      }
    }

    const { baseURL, apiKey, model, headers: extraHeaders, name } =
      getActiveProvider();

    const upstream = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
        max_tokens: 500, // 控制成本 & 逼 agent 簡潔
        temperature: 0.7,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      console.error(`[agent] upstream ${upstream.status}: ${text}`);
      return json(
        {
          error: `provider "${name}" returned ${upstream.status}`,
          detail: text.slice(0, 500),
        },
        502
      );
    }

    // 把 OpenAI SSE 格式轉成純文字 token stream
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = ""; // 跨 chunk 的未完成 line

    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // 最後一行可能不完整,留到下一輪

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed?.choices?.[0]?.delta?.content;
            if (typeof content === "string" && content.length > 0) {
              controller.enqueue(encoder.encode(content));
            }
          } catch {
            // parse error 就跳過這行,不中斷 stream
          }
        }
      },
      cancel() {
        reader.cancel().catch(() => {});
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "X-Agent-Provider": name,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[agent] error:", err);
    return json({ error: message }, 500);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
