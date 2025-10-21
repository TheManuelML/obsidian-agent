import { Model } from "src/types/ai";

// Available models
export const allAvailableModels: Model[] = [
  { 
    provider: "google", 
    name: "gemini-2.0-flash",
    capabilities: ["vision", "websearch"],
  },
  {
    provider: "google", 
    name: "gemini-2.5-flash",
    capabilities: ["vision", "websearch"],
  },
  {
    provider: "google", 
    name: "gemini-2.5-pro",
    capabilities: ["vision", "websearch"],
  },
  {
    provider: "google",
    name: "gemini-2.5-flash-lite",
    capabilities: ["vision", "websearch"]
  }
];