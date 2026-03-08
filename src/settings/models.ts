import { Model } from "src/types/ai";

// Available models
export const allAvailableModels: Model[] = [
  { 
    provider: "google", 
    name: "gemini-2.0-flash",
    capabilities: ["vision", "websearch"],
    description: "Second generation workhorse model, with a 1 million token context window.",
  },
  {
    provider: "google", 
    name: "gemini-2.5-flash",
    capabilities: ["vision", "websearch"],
    description: "Best model in terms of price-performance, offering well-rounded capabilities. 2.5 Flash is best for large scale processing, low-latency, high volume tasks that require thinking, and agentic use cases.",
  },
  {
    provider: "google",
    name: "gemini-2.5-flash-lite",
    capabilities: ["vision", "websearch"],
    description: "Fastest flash model optimized for cost-efficiency and high throughput.",
  },
  {
    provider: "google", 
    name: "gemini-2.5-pro",
    capabilities: ["vision", "websearch"],
    description: "State-of-the-art thinking model, capable of reasoning over complex problems in code, math, and STEM, as well as analyzing large datasets, codebases, and documents using long context.",
  },
  {
    provider: "google",
    name: "gemini-3-flash-preview",
    capabilities: ["vision", "websearch"],
    description: "The best model in the world for multimodal understanding, and our most powerful agentic and vibe-coding model yet, delivering richer visuals and deeper interactivity, all built on a foundation of state-of-the-art reasoning.",
  },
  {
    provider: "google",
    name: "gemini-3.1-flash-lite-preview",
    capabilities: ["vision", "websearch"],
    description: "Google's most cost-efficient multimodal model, offering the fastest performance for high-frequency, lightweight tasks. Gemini 3.1 Flash-Lite is best for high-volume agentic tasks, simple data extraction, and extremely low-latency applications where budget and speed are the primary constraints.",
  },
  {
    provider: "google",
    name: "gemini-3.1-pro-preview",
    capabilities: ["vision", "websearch"],
    description: "Built to refine the performance and reliability of the Gemini 3 Pro series, Gemini 3.1 Pro Preview provides better thinking, improved token efficiency, and a more grounded, factually consistent experience. It's optimized for software engineering behavior and usability, as well as agentic workflows requiring precise tool usage and reliable multi-step execution across real-world domains.",
  },
];
