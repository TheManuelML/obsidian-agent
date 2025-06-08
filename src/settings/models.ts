import { SafetySetting } from "@google/generative-ai"; 

export interface Model {
  provider: ModelProvider,
  name: string,
  capabilities: ModelCapability[]
}

export enum ModelProvider {
  OPENAI = 'openai',
  GOOGLE = 'google',
  ANTHROPIC = 'anthropic'
}

export enum ModelCapability {
  REASONING = "reasoning",
  VISION = "vision",
  WEB_SEARCH = "websearch",
}

export interface ModelConfig {
  modelName: string;
  temperature?: number;
  streaming: boolean;
  maxRetries: number;
  maxConcurrency?: number;
  maxTokens?: number;
  maxCompletionTokens?: number;
  apiKey?: string;
  enableCors?: boolean;
  safetySettings?: SafetySetting[]
}

// Available names and their providers
export const allAvailableModels: Model[] = [
    { 
      provider: ModelProvider.GOOGLE, 
      name: "gemini-1.5-flash",
      capabilities: []
    },
    { 
      provider: ModelProvider.GOOGLE, 
      name: "gemini-1.5-pro",
      capabilities: []
    },
    { 
      provider: ModelProvider.GOOGLE, 
      name: "gemini-2.0-flash",
      capabilities: []
    },
    { 
      provider: ModelProvider.OPENAI, 
      name: "gpt-4.1",
      capabilities: []
    },
    { 
      provider: ModelProvider.OPENAI, 
      name: "gpt-4o",
      capabilities: []
    },
    { 
      provider: ModelProvider.OPENAI, 
      name: "gpt-4o-mini",
      capabilities: []
    },
    { 
      provider: ModelProvider.ANTHROPIC, 
      name: "claude-3-5-sonnet",
      capabilities: []
    },
    { 
      provider: ModelProvider.ANTHROPIC, 
      name: "claude-4-sonnet",
      capabilities: []
    }
  ];