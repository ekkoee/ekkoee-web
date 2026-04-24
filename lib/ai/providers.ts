/**
 * AI Provider 路由層
 *
 * 支援三個 OpenAI-compatible provider:
 * - openrouter (免費 tier,最省事,預設)
 * - nvidia    (NIM 免費 credits,備援)
 * - ollama    (本地 5070Ti,dev 測試或 self-host)
 *
 * 三家 API 介面都一樣,只差 baseURL / apiKey / model / 特殊 header。
 * 切換只要改 .env.local 的 AI_PROVIDER。
 */

export type ProviderName = "openrouter" | "nvidia" | "ollama";

export interface ProviderConfig {
  name: ProviderName;
  baseURL: string;
  apiKey: string;
  model: string;
  headers?: Record<string, string>;
}

function getConfig(name: ProviderName): ProviderConfig {
  switch (name) {
    case "openrouter":
      return {
        name,
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY ?? "",
        model:
          process.env.OPENROUTER_MODEL ??
          "meta-llama/llama-3.3-70b-instruct:free",
        // OpenRouter 建議帶這兩個 header 做 attribution
        headers: {
          "HTTP-Referer": "https://www.ekkoee.com",
          "X-Title": "ekkoee",
        },
      };

    case "nvidia":
      return {
        name,
        baseURL: "https://integrate.api.nvidia.com/v1",
        apiKey: process.env.NVIDIA_API_KEY ?? "",
        model: process.env.NVIDIA_MODEL ?? "meta/llama-3.3-70b-instruct",
      };

    case "ollama":
      return {
        name,
        // 本地 Ollama 的 OpenAI-compatible endpoint
        baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
        apiKey: "ollama", // Ollama 不檢查 key,隨便填
        model: process.env.OLLAMA_MODEL ?? "llama3.1:8b",
      };
  }
}

/**
 * 讀取 AI_PROVIDER env,回傳該 provider 的 config。
 * 如果沒設定 API key 會丟錯(Ollama 除外)。
 */
export function getActiveProvider(): ProviderConfig {
  const raw = (process.env.AI_PROVIDER ?? "openrouter").toLowerCase();

  if (raw !== "openrouter" && raw !== "nvidia" && raw !== "ollama") {
    throw new Error(
      `Unknown AI_PROVIDER: "${raw}". Expected: openrouter | nvidia | ollama`
    );
  }

  const config = getConfig(raw as ProviderName);

  // Ollama 不需要真的 API key,其他兩家要
  if (config.name !== "ollama" && !config.apiKey) {
    throw new Error(
      `Missing API key for provider "${config.name}". ` +
        `Set ${config.name === "openrouter" ? "OPENROUTER_API_KEY" : "NVIDIA_API_KEY"} in .env.local`
    );
  }

  return config;
}
