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
];