import { Model } from "src/types";

// Available names and their providers
export const allAvailableModels: Model[] = [
    { 
      provider: "google", 
      name: "gemini-1.5-flash",
      readImage: false,
      webSearch: false,
      embedding: false,
      streaming: false,
    },
    { 
      provider: "google", 
      name: "gemini-1.5-pro",
      readImage: false,
      webSearch: false,
      embedding: false,
      streaming: false,
    },
    { 
      provider: "google", 
      name: "gemini-2.0-flash",
      readImage: false,
      webSearch: false,
      embedding: false,
      streaming: false,
    },
    { 
      provider: "openai", 
      name: "gpt-4.1",
      readImage: false,
      webSearch: false,
      embedding: false,
      streaming: false,
    },
    { 
      provider: "openai", 
      name: "gpt-4o",
      readImage: false,
      webSearch: false,
      embedding: false,
      streaming: false,
    },
    { 
      provider: "openai", 
      name: "gpt-4o-mini",
      readImage: false,
      webSearch: false,
      embedding: false,
      streaming: false,
    },
    { 
      provider: "anthropic", 
      name: "claude-3-5-sonnet",
      readImage: false,
      webSearch: false,
      embedding: false,
      streaming: false,
    },
    { 
      provider: "anthropic", 
      name: "claude-4-sonnet",
      readImage: false,
      webSearch: false,
      embedding: false,
      streaming: false,
    }
  ];