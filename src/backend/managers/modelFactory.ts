import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatAnthropic, tools as anthropicTools } from "@langchain/anthropic";
import { ChatOpenAI, tools as openaiTools } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";
import { getSettings } from "src/plugin";
import { DEFAULT_SETTINGS } from "src/settings/SettingsTab";
import { Provider } from "src/types/ai";

// Default endpoint for the OpenRouter provider (OpenAI-compatible API)
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Parses a settings text field into a number, treating the sentinel
// "Default" value (and anything non-numeric) as "let the provider decide".
function parseOptionalNumber(value: string, fallback: string): number | undefined {
  if (value === fallback) return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

// Builds the chat model for the provider currently selected in settings.
// Throws a clean Error (caught upstream and shown via Notice) when the
// active provider is missing the credentials it needs.
export function buildChatModel(): BaseChatModel {
  const settings = getSettings();
  const temperature = parseOptionalNumber(settings.temperature, DEFAULT_SETTINGS.temperature);
  const maxOutputTokens = parseOptionalNumber(settings.maxOutputTokens, DEFAULT_SETTINGS.maxOutputTokens);
  const baseUrl = settings.baseUrl.trim() || undefined;

  switch (settings.provider) {
    case "google": {
      if (!settings.googleApiKey.trim()) {
        throw new Error("Set your Google API key in the plugin settings before sending a message.");
      }

      // Thinking level only applies to Gemini 3 models, others ignore it
      const thinkingLevel: "LOW" | "HIGH" = settings.thinkingLevel === "Low" ? "LOW" : "HIGH";
      const thinkingConfig = settings.model.includes("3") && settings.thinkingLevel !== DEFAULT_SETTINGS.thinkingLevel
        ? { includeThoughts: true, thinkingLevel }
        : { includeThoughts: true };

      return new ChatGoogleGenerativeAI({
        model: settings.model,
        apiKey: settings.googleApiKey,
        temperature,
        maxOutputTokens,
        baseUrl,
        thinkingConfig,
      });
    }

    case "anthropic": {
      if (!settings.anthropicApiKey.trim()) {
        throw new Error("Set your Anthropic API key in the plugin settings before sending a message.");
      }

      return new ChatAnthropic({
        model: settings.model,
        apiKey: settings.anthropicApiKey,
        temperature,
        maxTokens: maxOutputTokens,
        clientOptions: {
          baseURL: baseUrl,
          // Required for the Anthropic SDK to run from the Obsidian renderer (browser-like) process
          dangerouslyAllowBrowser: true,
          defaultHeaders: { "anthropic-dangerous-direct-browser-access": "true" },
        },
      });
    }

    case "openai": {
      if (!settings.openaiApiKey.trim()) {
        throw new Error("Set your OpenAI API key in the plugin settings before sending a message.");
      }

      return new ChatOpenAI({
        model: settings.model,
        apiKey: settings.openaiApiKey,
        temperature,
        maxTokens: maxOutputTokens,
        // The Responses API is required for OpenAI's native web_search tool
        useResponsesApi: true,
        configuration: {
          baseURL: baseUrl,
          dangerouslyAllowBrowser: true,
        },
      });
    }

    case "openrouter": {
      if (!settings.openrouterApiKey.trim()) {
        throw new Error("Set your OpenRouter API key in the plugin settings before sending a message.");
      }

      // OpenRouter exposes an OpenAI-compatible Chat Completions API, so the
      // OpenAI client is reused. The Responses API stays off because
      // OpenRouter's support for it is partial and it is only needed for
      // OpenAI's native web search, which OpenRouter can't run.
      // The endpoint is fixed: the shared base URL override is ignored so a
      // value left over from another provider can't break OpenRouter calls.
      return new ChatOpenAI({
        model: settings.model,
        apiKey: settings.openrouterApiKey,
        temperature,
        maxTokens: maxOutputTokens,
        useResponsesApi: false,
        configuration: {
          baseURL: OPENROUTER_BASE_URL,
          dangerouslyAllowBrowser: true,
        },
      });
    }

    case "ollama": {
      const ollamaBaseUrl = settings.ollamaBaseUrl.trim() || DEFAULT_SETTINGS.ollamaBaseUrl;

      return new ChatOllama({
        model: settings.model,
        baseUrl: ollamaBaseUrl,
        temperature,
      });
    }
  }
}

// Returns the provider-native web search tool descriptor to register with the
// agent, or null when the provider has no native web search (OpenRouter, Ollama).
// These descriptors are executed server-side by the provider, the agent's
// tool node never runs them locally.
export function getNativeWebSearchTool(provider: Provider): Record<string, unknown> | null {
  switch (provider) {
    case "anthropic":
      return anthropicTools.webSearch_20250305({ maxUses: 5 });
    case "openai":
      return openaiTools.webSearch();
    case "google":
      // Gemini's API rejects requests that combine built-in tools (like
      // googleSearch) with function declarations, and this agent always
      // registers vault function tools, so native search can't be offered here.
      return null;
    case "openrouter":
      // Provider-native search descriptors are tied to each vendor's own API
      // and are not forwarded by OpenRouter's Chat Completions endpoint.
      return null;
    case "ollama":
      return null;
  }
}

// Translates provider/SDK errors into clean, user-facing messages.
// Anthropic, OpenAI, and Google SDKs all throw errors carrying an HTTP
// `status`; Ollama/network failures usually surface as plain fetch errors.
// Shared by callModel and callAgent so every entry point shows the same
// friendly Notice instead of a raw stack trace.
export function translateModelError(error: unknown): Error {
  if (error instanceof Error) {
    const status = (error as { status?: number }).status;

    if (status === 401 || status === 403) {
      return new Error("Invalid or missing API key. Check your provider credentials in the plugin settings.");
    }
    if (status === 429) {
      return new Error("Rate limit or quota exceeded. Please wait a moment and try again, or check your provider account.");
    }
    if (status === 503 || status === 529) {
      return new Error("The model provider is temporarily overloaded. Please try again later.");
    }
    if (status !== undefined) {
      return new Error(`Provider API error (${status}): ${error.message}`);
    }

    // Network/CORS failures usually surface as generic fetch errors with no status
    if (/fetch|network|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(error.message)) {
      return new Error("Could not reach the model provider. Check your network connection or base URL/Ollama settings.");
    }

    return error;
  }

  return new Error(`Unexpected error: ${String(error)}`);
}
