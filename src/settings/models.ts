import { SuggestedModel } from "src/types/ai";

// Curated suggestions shown in the model picker, grouped by provider.
// These are only starting points: model names are always typed/edited
// manually in settings, since providers ship new models far more often
// than this list could be kept in sync.
export const suggestedModels: SuggestedModel[] = [
  // Google
  {
    provider: "google",
    name: "gemini-2.5-flash",
    description: "Best model in terms of price-performance, offering well-rounded capabilities for agentic use cases.",
  },
  {
    provider: "google",
    name: "gemini-2.5-pro",
    description: "State-of-the-art thinking model, capable of reasoning over complex problems in code, math, and STEM.",
  },
  {
    provider: "google",
    name: "gemini-2.5-flash-lite",
    description: "Fastest Gemini model, optimized for cost-efficiency and high throughput.",
  },

  // Anthropic
  {
    provider: "anthropic",
    name: "claude-sonnet-4-5",
    description: "Balanced Claude model for everyday agentic and coding tasks, with strong reasoning and tool use.",
  },
  {
    provider: "anthropic",
    name: "claude-opus-4-1",
    description: "Anthropic's most capable model, best suited for the hardest reasoning and analysis tasks.",
  },
  {
    provider: "anthropic",
    name: "claude-haiku-4-5",
    description: "Fast, lightweight Claude model for high-volume or latency-sensitive tasks.",
  },

  // OpenAI
  {
    provider: "openai",
    name: "gpt-5",
    description: "OpenAI's flagship model, strong at reasoning, coding, and agentic tool use.",
  },
  {
    provider: "openai",
    name: "gpt-5-mini",
    description: "Smaller, faster GPT-5 variant for cost-sensitive or high-throughput use cases.",
  },
  {
    provider: "openai",
    name: "gpt-4.1",
    description: "Versatile general-purpose model with a large context window.",
  },

  // OpenRouter (model names use OpenRouter's vendor/model format)
  {
    provider: "openrouter",
    name: "anthropic/claude-sonnet-5.5",
    description: "Claude Sonnet routed through OpenRouter, one API key for many vendors.",
  },
  {
    provider: "openrouter",
    name: "openai/gpt-6-astra",
    description: "GPT-6 Astra routed through OpenRouter, one API key for many vendors.",
  },
  {
    provider: "openrouter",
    name: "google/gemini-3.8-flash",
    description: "Gemini Flash routed through OpenRouter, one API key for many vendors.",
  },

  // Ollama (local)
  {
    provider: "ollama",
    name: "llama3.1",
    description: "Meta's open-weight model, runs locally through Ollama. Requires the model to be pulled first.",
  },
  {
    provider: "ollama",
    name: "qwen2.5",
    description: "Alibaba's open-weight model, runs locally through Ollama. Requires the model to be pulled first.",
  },
  {
    provider: "ollama",
    name: "mistral",
    description: "Mistral's open-weight model, runs locally through Ollama. Requires the model to be pulled first.",
  },
];
